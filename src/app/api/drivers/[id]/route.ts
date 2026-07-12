import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, conflict, notFound, isUniqueError } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  licenseNumber: z.string().trim().min(1).optional(),
  licenseCategory: z.string().trim().min(1).optional(),
  licenseExpiry: z.coerce.date().optional(),
  contactNumber: z.string().trim().optional().nullable(),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]).optional(),
  region: z.string().trim().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("drivers", "view");
  if (error) return error;
  const { id } = await params;
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: { trips: { orderBy: { createdAt: "desc" }, take: 10, include: { vehicle: true } } },
  });
  if (!driver) return notFound("Driver not found");
  return NextResponse.json({ driver });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("drivers", "manage");
  if (error) return error;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Please check the driver details", parsed.error.flatten());
  const existing = await prisma.driver.findUnique({ where: { id } });
  if (!existing) return notFound("Driver not found");
  try {
    const data = { ...parsed.data };
    if (data.contactNumber === "") data.contactNumber = null;
    if (data.region === "") data.region = null;
    const driver = await prisma.driver.update({ where: { id }, data });
    return NextResponse.json({ driver });
  } catch (e) {
    if (isUniqueError(e)) return conflict("A driver with this license number already exists");
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("drivers", "manage");
  if (error) return error;
  const { id } = await params;
  const existing = await prisma.driver.findUnique({ where: { id } });
  if (!existing) return notFound("Driver not found");
  await prisma.driver.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
