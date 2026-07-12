import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, conflict, notFound } from "@/lib/api";
import { reconcileVehicleStatus } from "@/lib/maintenance";

const createSchema = z.object({
  vehicleId: z.string().min(1),
  serviceType: z.string().trim().min(1),
  cost: z.coerce.number().nonnegative().default(0),
  date: z.coerce.date().optional(),
  status: z.enum(["Active", "Completed"]).default("Active"),
  notes: z.string().trim().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { error } = await authorize("maintenance", "view");
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const q = sp.get("q");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { serviceType: { contains: q } },
      { vehicle: { name: { contains: q } } },
      { vehicle: { registrationNumber: { contains: q } } },
    ];
  }
  const logs = await prisma.maintenanceLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: { vehicle: true },
  });
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const { error } = await authorize("maintenance", "manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return badRequest("Please check the maintenance details", parsed.error.flatten());
  const d = parsed.data;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: d.vehicleId } });
  if (!vehicle) return notFound("Vehicle not found");
  if (d.status === "Active" && vehicle.status === "On Trip") {
    return conflict("This vehicle is on a trip. Complete or cancel the trip before servicing it.");
  }
  if (d.status === "Active" && vehicle.status === "Retired") {
    return conflict("This vehicle is retired.");
  }
  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.maintenanceLog.create({
      data: {
        vehicleId: d.vehicleId,
        serviceType: d.serviceType,
        cost: d.cost,
        date: d.date ?? new Date(),
        status: d.status,
        notes: d.notes || null,
        closedAt: d.status === "Completed" ? new Date() : null,
      },
    });
    await reconcileVehicleStatus(tx, d.vehicleId);
    return created;
  });
  return NextResponse.json({ log }, { status: 201 });
}
