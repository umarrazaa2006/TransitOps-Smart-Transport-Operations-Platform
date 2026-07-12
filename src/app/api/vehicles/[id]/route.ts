import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, conflict, notFound, isUniqueError } from "@/lib/api";

const updateSchema = z.object({
  registrationNumber: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  maxLoadCapacity: z.coerce.number().nonnegative().optional(),
  odometer: z.coerce.number().nonnegative().optional(),
  acquisitionCost: z.coerce.number().nonnegative().optional(),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]).optional(),
  region: z.string().trim().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("fleet", "view");
  if (error) return error;
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      documents: true,
      maintenanceLogs: { orderBy: { date: "desc" } },
      fuelLogs: { orderBy: { date: "desc" } },
      trips: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!vehicle) return notFound("Vehicle not found");
  const fuelCost = vehicle.fuelLogs.reduce((s, f) => s + f.cost, 0);
  const maintenanceCost = vehicle.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
  const revenue = vehicle.trips
    .filter((t) => t.status === "Completed")
    .reduce((s, t) => s + t.revenue, 0);
  return NextResponse.json({
    vehicle,
    costs: { fuelCost, maintenanceCost, operationalCost: fuelCost + maintenanceCost, revenue },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("fleet", "manage");
  if (error) return error;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return badRequest("Please check the vehicle details", parsed.error.flatten());
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) return notFound("Vehicle not found");
  try {
    const data = { ...parsed.data };
    if (data.region === "") data.region = null;
    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json({ vehicle });
  } catch (e) {
    if (isUniqueError(e)) return conflict("A vehicle with this registration number already exists");
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("fleet", "manage");
  if (error) return error;
  const { id } = await params;
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) return notFound("Vehicle not found");
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
