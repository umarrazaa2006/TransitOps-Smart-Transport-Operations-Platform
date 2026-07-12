import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, notFound } from "@/lib/api";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await authorize("expenses", "manage");
  if (error) return error;
  const { id } = await params;
  const existing = await prisma.fuelLog.findUnique({ where: { id } });
  if (!existing) return notFound("Fuel log not found");
  await prisma.fuelLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
