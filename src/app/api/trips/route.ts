import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, conflict, nextTripCode } from "@/lib/api";
import { assignmentError } from "@/lib/trips";

const createSchema = z.object({
  source: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  vehicleId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  cargoWeight: z.coerce.number().nonnegative().default(0),
  plannedDistance: z.coerce.number().nonnegative().default(0),
  revenue: z.coerce.number().nonnegative().default(0),
  region: z.string().trim().optional().nullable(),
  action: z.enum(["draft", "dispatch"]).default("draft"),
});

export async function GET(req: NextRequest) {
  const { error } = await authorize("trips", "view");
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const q = sp.get("q");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { tripCode: { contains: q } },
      { source: { contains: q } },
      { destination: { contains: q } },
    ];
  }
  const trips = await prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { vehicle: true, driver: true },
  });
  return NextResponse.json({ trips });
}

export async function POST(req: NextRequest) {
  const { error } = await authorize("trips", "manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Please check the trip details", parsed.error.flatten());
  const d = parsed.data;
  const code = await nextTripCode();

  if (d.action === "dispatch") {
    const vehicle = d.vehicleId
      ? await prisma.vehicle.findUnique({ where: { id: d.vehicleId } })
      : null;
    const driver = d.driverId
      ? await prisma.driver.findUnique({ where: { id: d.driverId } })
      : null;
    const err = assignmentError(vehicle, driver, d.cargoWeight);
    if (err) return conflict(err);
    const trip = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.create({
        data: {
          tripCode: code,
          source: d.source,
          destination: d.destination,
          vehicleId: d.vehicleId,
          driverId: d.driverId,
          cargoWeight: d.cargoWeight,
          plannedDistance: d.plannedDistance,
          revenue: d.revenue,
          region: d.region || null,
          status: "Dispatched",
          dispatchedAt: new Date(),
          startOdometer: vehicle ? vehicle.odometer : null,
        },
      });
      await tx.vehicle.update({
        where: { id: d.vehicleId as string },
        data: { status: "On Trip" },
      });
      await tx.driver.update({ where: { id: d.driverId as string }, data: { status: "On Trip" } });
      return t;
    });
    return NextResponse.json({ trip }, { status: 201 });
  }

  const trip = await prisma.trip.create({
    data: {
      tripCode: code,
      source: d.source,
      destination: d.destination,
      vehicleId: d.vehicleId || null,
      driverId: d.driverId || null,
      cargoWeight: d.cargoWeight,
      plannedDistance: d.plannedDistance,
      revenue: d.revenue,
      region: d.region || null,
      status: "Draft",
    },
  });
  return NextResponse.json({ trip }, { status: 201 });
}
