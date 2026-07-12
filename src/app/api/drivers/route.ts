import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, conflict, isUniqueError } from "@/lib/api";

const createSchema = z.object({
  name: z.string().trim().min(1),
  licenseNumber: z.string().trim().min(1),
  licenseCategory: z.string().trim().min(1),
  licenseExpiry: z.coerce.date(),
  contactNumber: z.string().trim().optional().nullable(),
  safetyScore: z.coerce.number().min(0).max(100).default(100),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]).default("Available"),
  region: z.string().trim().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { error } = await authorize("drivers", "view");
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const q = sp.get("q");
  const available = sp.get("available");
  const where: Record<string, unknown> = {};
  if (available === "1") {
    where.status = "Available";
    where.licenseExpiry = { gte: new Date() };
  } else if (status) {
    where.status = status;
  }
  if (q) where.OR = [{ name: { contains: q } }, { licenseNumber: { contains: q } }];
  const drivers = await prisma.driver.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({ drivers });
}

export async function POST(req: NextRequest) {
  const { error } = await authorize("drivers", "manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("Please check the driver details", parsed.error.flatten());
  try {
    const driver = await prisma.driver.create({
      data: {
        ...parsed.data,
        contactNumber: parsed.data.contactNumber || null,
        region: parsed.data.region || null,
      },
    });
    return NextResponse.json({ driver }, { status: 201 });
  } catch (e) {
    if (isUniqueError(e)) return conflict("A driver with this license number already exists");
    throw e;
  }
}
