import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, conflict, notFound } from "@/lib/api";
import { reconcileVehicleStatus } from "@/lib/maintenance";

const updateSchema = z.object({
  serviceType: z.string().trim().min(1).optional(),
  cost: z.coerce.number().nonnegative().optional(),
  date: z.coerce.date().optional(),
  status: z.enum(["Active", "Completed"]).optional(),
  notes: z.string().trim().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("maintenance", "manage");
  if (error) return error;
  const { id } = await params;
  const existing = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!existing) return notFound("Maintenance record not found");
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return badRequest("Please check the maintenance details", parsed.error.flatten());
  const d = parsed.data;
  if (d.status === "Active") {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: existing.vehicleId } });
    if (vehicle && vehicle.status === "On Trip") {
      return conflict("This vehicle is on a trip and cannot be reopened for service.");
    }
  }
  const log = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceLog.update({
      where: { id },
      data: {
        ...d,
        notes: d.notes === "" ? null : d.notes,
        closedAt:
          d.status === "Completed" ? new Date() : d.status === "Active" ? null : existing.closedAt,
      },
    });
    await reconcileVehicleStatus(tx, existing.vehicleId);
    return updated;
  });
  return NextResponse.json({ log });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("maintenance", "manage");
  if (error) return error;
  const { id } = await params;
  const existing = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!existing) return notFound("Maintenance record not found");
  await prisma.$transaction(async (tx) => {
    await tx.maintenanceLog.delete({ where: { id } });
    await reconcileVehicleStatus(tx, existing.vehicleId);
  });
  return NextResponse.json({ ok: true });
}
