import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, notFound } from "@/lib/api";

const createSchema = z.object({
  vehicleId: z.string().min(1),
  tripId: z.string().optional().nullable(),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().nonnegative(),
  odometer: z.coerce.number().nonnegative().optional().nullable(),
  date: z.coerce.date().optional(),
});

export async function GET(req: NextRequest) {
  const { error } = await authorize("expenses", "view");
  if (error) return error;
  const q = req.nextUrl.searchParams.get("q");
  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { vehicle: { name: { contains: q } } },
      { vehicle: { registrationNumber: { contains: q } } },
    ];
  }
  const logs = await prisma.fuelLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: { vehicle: true, trip: true },
  });
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const { error } = await authorize("expenses", "manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return badRequest("Please check the fuel log details", parsed.error.flatten());
  const d = parsed.data;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: d.vehicleId } });
  if (!vehicle) return notFound("Vehicle not found");
  const log = await prisma.fuelLog.create({
    data: {
      vehicleId: d.vehicleId,
      tripId: d.tripId || null,
      liters: d.liters,
      cost: d.cost,
      odometer: d.odometer ?? null,
      date: d.date ?? new Date(),
    },
  });
  return NextResponse.json({ log }, { status: 201 });
}
