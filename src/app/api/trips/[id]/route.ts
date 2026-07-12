import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, conflict, notFound } from "@/lib/api";
import { assignmentError } from "@/lib/trips";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("trips", "view");
  if (error) return error;
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true, fuelLogs: true, expenses: true },
  });
  if (!trip) return notFound("Trip not found");
  return NextResponse.json({ trip });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("trips", "manage");
  if (error) return error;
  const { id } = await params;
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) return notFound("Trip not found");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : undefined;

  if (action === "dispatch") {
    if (trip.status !== "Draft") return conflict("Only draft trips can be dispatched");
    const vehicleId = (body.vehicleId as string) ?? trip.vehicleId;
    const driverId = (body.driverId as string) ?? trip.driverId;
    const cargoWeight = body.cargoWeight != null ? Number(body.cargoWeight) : trip.cargoWeight;
    const vehicle = vehicleId
      ? await prisma.vehicle.findUnique({ where: { id: vehicleId } })
      : null;
    const driver = driverId ? await prisma.driver.findUnique({ where: { id: driverId } }) : null;
    const err = assignmentError(vehicle, driver, cargoWeight);
    if (err) return conflict(err);
    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.update({
        where: { id },
        data: {
          status: "Dispatched",
          vehicleId,
          driverId,
          cargoWeight,
          dispatchedAt: new Date(),
          startOdometer: vehicle ? vehicle.odometer : null,
        },
      });
      await tx.vehicle.update({ where: { id: vehicleId as string }, data: { status: "On Trip" } });
      await tx.driver.update({ where: { id: driverId as string }, data: { status: "On Trip" } });
      return t;
    });
    return NextResponse.json({ trip: updated });
  }

  if (action === "complete") {
    if (trip.status !== "Dispatched") return conflict("Only dispatched trips can be completed");
    const schema = z.object({
      endOdometer: z.coerce.number().nonnegative(),
      fuelConsumed: z.coerce.number().nonnegative(),
      revenue: z.coerce.number().nonnegative().optional(),
      fuelCost: z.coerce.number().nonnegative().optional(),
    });
    const p = schema.safeParse(body);
    if (!p.success)
      return badRequest("Enter the final odometer and fuel consumed", p.error.flatten());
    const start = trip.startOdometer ?? 0;
    if (p.data.endOdometer < start) {
      return badRequest("Final odometer cannot be less than the start odometer (" + start + ")");
    }
    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.update({
        where: { id },
        data: {
          status: "Completed",
          completedAt: new Date(),
          endOdometer: p.data.endOdometer,
          fuelConsumed: p.data.fuelConsumed,
          revenue: p.data.revenue ?? trip.revenue,
        },
      });
      if (trip.vehicleId) {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "Available", odometer: p.data.endOdometer },
        });
      }
      if (trip.driverId) {
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });
      }
      if (p.data.fuelConsumed > 0 && trip.vehicleId) {
        await tx.fuelLog.create({
          data: {
            vehicleId: trip.vehicleId,
            tripId: id,
            liters: p.data.fuelConsumed,
            cost: p.data.fuelCost ?? 0,
            odometer: p.data.endOdometer,
          },
        });
      }
      return t;
    });
    return NextResponse.json({ trip: updated });
  }

  if (action === "cancel") {
    if (trip.status === "Completed") return conflict("Completed trips cannot be cancelled");
    if (trip.status === "Cancelled") return conflict("This trip is already cancelled");
    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.update({
        where: { id },
        data: { status: "Cancelled", cancelledAt: new Date() },
      });
      if (trip.status === "Dispatched") {
        if (trip.vehicleId) {
          await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "Available" } });
        }
        if (trip.driverId) {
          await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });
        }
      }
      return t;
    });
    return NextResponse.json({ trip: updated });
  }

  if (trip.status !== "Draft") return conflict("Only draft trips can be edited");
  const editSchema = z.object({
    source: z.string().trim().min(1).optional(),
    destination: z.string().trim().min(1).optional(),
    vehicleId: z.string().nullable().optional(),
    driverId: z.string().nullable().optional(),
    cargoWeight: z.coerce.number().nonnegative().optional(),
    plannedDistance: z.coerce.number().nonnegative().optional(),
    revenue: z.coerce.number().nonnegative().optional(),
    region: z.string().trim().nullable().optional(),
  });
  const p = editSchema.safeParse(body);
  if (!p.success) return badRequest("Please check the trip details", p.error.flatten());
  const data = { ...p.data };
  if (data.vehicleId === "") data.vehicleId = null;
  if (data.driverId === "") data.driverId = null;
  if (data.region === "") data.region = null;
  const updated = await prisma.trip.update({ where: { id }, data });
  return NextResponse.json({ trip: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("trips", "manage");
  if (error) return error;
  const { id } = await params;
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) return notFound("Trip not found");
  await prisma.$transaction(async (tx) => {
    if (trip.status === "Dispatched") {
      if (trip.vehicleId) {
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "Available" } });
      }
      if (trip.driverId) {
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });
      }
    }
    await tx.trip.delete({ where: { id } });
  });
  return NextResponse.json({ ok: true });
}
