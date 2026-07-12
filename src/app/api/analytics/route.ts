import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/api";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function GET(req: NextRequest) {
  const { error } = await authorize("analytics", "view");
  if (error) return error;
  const format = req.nextUrl.searchParams.get("format");

  const vehicles = await prisma.vehicle.findMany({
    include: { fuelLogs: true, maintenanceLogs: true, expenses: true, trips: true },
  });

  const perVehicle = vehicles.map((v) => {
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const fuelLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
    const otherExpenses = v.expenses.reduce((s, e) => s + e.amount, 0);
    const completed = v.trips.filter((t) => t.status === "Completed");
    const revenue = completed.reduce((s, t) => s + t.revenue, 0);
    const distance = completed.reduce((s, t) => {
      const d =
        t.endOdometer != null && t.startOdometer != null
          ? t.endOdometer - t.startOdometer
          : t.plannedDistance;
      return s + d;
    }, 0);
    const tripFuel = completed.reduce((s, t) => s + (t.fuelConsumed || 0), 0);
    const operationalCost = fuelCost + maintenanceCost;
    const roi =
      v.acquisitionCost > 0
        ? ((revenue - (maintenanceCost + fuelCost)) / v.acquisitionCost) * 100
        : 0;
    const efficiency = tripFuel > 0 ? distance / tripFuel : 0;
    return {
      id: v.id,
      registrationNumber: v.registrationNumber,
      name: v.name,
      type: v.type,
      acquisitionCost: v.acquisitionCost,
      fuelCost,
      fuelLiters,
      maintenanceCost,
      otherExpenses,
      operationalCost,
      revenue,
      distance,
      roi,
      efficiency,
    };
  });

  const totals = perVehicle.reduce(
    (acc, v) => {
      acc.fuelCost += v.fuelCost;
      acc.maintenanceCost += v.maintenanceCost;
      acc.operationalCost += v.operationalCost;
      acc.revenue += v.revenue;
      acc.distance += v.distance;
      acc.otherExpenses += v.otherExpenses;
      acc.acquisitionCost += v.acquisitionCost;
      return acc;
    },
    {
      fuelCost: 0,
      maintenanceCost: 0,
      operationalCost: 0,
      revenue: 0,
      distance: 0,
      otherExpenses: 0,
      acquisitionCost: 0,
    }
  );

  const completedTrips = await prisma.trip.findMany({
    where: { status: "Completed" },
    select: {
      revenue: true,
      completedAt: true,
      createdAt: true,
      startOdometer: true,
      endOdometer: true,
      plannedDistance: true,
      fuelConsumed: true,
    },
  });
  let totalDist = 0;
  let totalFuel = 0;
  for (const t of completedTrips) {
    const d =
      t.endOdometer != null && t.startOdometer != null
        ? t.endOdometer - t.startOdometer
        : t.plannedDistance;
    totalDist += d;
    totalFuel += t.fuelConsumed || 0;
  }
  const fuelEfficiency = totalFuel > 0 ? totalDist / totalFuel : 0;

  const statusGroup = await prisma.vehicle.groupBy({ by: ["status"], _count: true });
  let onTrip = 0;
  let nonRetired = 0;
  for (const g of statusGroup) {
    if (g.status !== "Retired") nonRetired += g._count;
    if (g.status === "On Trip") onTrip = g._count;
  }
  const fleetUtilization = nonRetired > 0 ? Math.round((onTrip / nonRetired) * 100) : 0;
  const roi =
    totals.acquisitionCost > 0
      ? ((totals.revenue - (totals.maintenanceCost + totals.fuelCost)) / totals.acquisitionCost) *
        100
      : 0;

  const now = new Date();
  const months: { key: string; label: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: d.getFullYear() + "-" + d.getMonth(),
      label: d.toLocaleString("en-US", { month: "short" }),
      revenue: 0,
    });
  }
  for (const t of completedTrips) {
    const dt = t.completedAt ?? t.createdAt;
    const key = dt.getFullYear() + "-" + dt.getMonth();
    const m = months.find((x) => x.key === key);
    if (m) m.revenue += t.revenue;
  }

  const costliestVehicles = [...perVehicle]
    .sort((a, b) => b.operationalCost - a.operationalCost)
    .slice(0, 5)
    .map((v) => ({ name: v.name, operationalCost: v.operationalCost }));

  if (format === "csv") {
    const header = [
      "Registration",
      "Vehicle",
      "Type",
      "Acquisition Cost",
      "Fuel Cost",
      "Maintenance Cost",
      "Operational Cost",
      "Revenue",
      "Distance (km)",
      "Fuel Efficiency (km/l)",
      "ROI (%)",
    ];
    const rows = perVehicle.map((v) => [
      v.registrationNumber,
      v.name,
      v.type,
      v.acquisitionCost,
      v.fuelCost,
      v.maintenanceCost,
      v.operationalCost,
      v.revenue,
      v.distance,
      v.efficiency.toFixed(2),
      v.roi.toFixed(1),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transitops-report.csv"',
      },
    });
  }

  return NextResponse.json({
    summary: {
      fuelEfficiency,
      fleetUtilization,
      operationalCost: totals.operationalCost,
      roi,
      revenue: totals.revenue,
      otherExpenses: totals.otherExpenses,
    },
    monthlyRevenue: months.map((m) => ({ month: m.label, revenue: m.revenue })),
    costliestVehicles,
    perVehicle,
  });
}
