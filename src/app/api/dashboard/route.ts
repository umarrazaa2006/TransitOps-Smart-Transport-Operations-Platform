import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { error } = await authorize("dashboard", "view");
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type");
  const region = sp.get("region");
  const status = sp.get("status");

  const vWhere: Record<string, unknown> = {};
  if (type) vWhere.type = type;
  if (region) vWhere.region = region;
  if (status) vWhere.status = status;

  const vehicles = await prisma.vehicle.findMany({ where: vWhere, select: { status: true } });
  const vehicleStatus: Record<string, number> = {
    Available: 0,
    "On Trip": 0,
    "In Shop": 0,
    Retired: 0,
  };
  for (const v of vehicles) vehicleStatus[v.status] = (vehicleStatus[v.status] || 0) + 1;
  const totalVehicles = vehicles.length;
  const nonRetired = totalVehicles - vehicleStatus.Retired;
  const fleetUtilization =
    nonRetired > 0 ? Math.round((vehicleStatus["On Trip"] / nonRetired) * 100) : 0;

  const tWhere: Record<string, unknown> = {};
  if (region) tWhere.region = region;
  const activeTrips = await prisma.trip.count({ where: { ...tWhere, status: "Dispatched" } });
  const pendingTrips = await prisma.trip.count({ where: { ...tWhere, status: "Draft" } });

  const dWhere: Record<string, unknown> = {};
  if (region) dWhere.region = region;
  const driversOnDuty = await prisma.driver.count({
    where: { ...dWhere, status: { in: ["Available", "On Trip"] } },
  });
  const driversOnTrip = await prisma.driver.count({ where: { ...dWhere, status: "On Trip" } });

  const recentTrips = await prisma.trip.findMany({
    where: tWhere,
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { vehicle: true, driver: true },
  });

  return NextResponse.json({
    kpis: {
      activeVehicles: vehicleStatus.Available + vehicleStatus["On Trip"],
      availableVehicles: vehicleStatus.Available,
      inMaintenance: vehicleStatus["In Shop"],
      activeTrips,
      pendingTrips,
      driversOnDuty,
      driversOnTrip,
      fleetUtilization,
      totalVehicles,
    },
    vehicleStatus,
    recentTrips,
  });
}
