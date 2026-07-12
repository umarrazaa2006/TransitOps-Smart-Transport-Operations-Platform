import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest, conflict, isUniqueError } from "@/lib/api";

const createSchema = z.object({
  registrationNumber: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.string().trim().min(1),
  maxLoadCapacity: z.coerce.number().nonnegative(),
  odometer: z.coerce.number().nonnegative().default(0),
  acquisitionCost: z.coerce.number().nonnegative().default(0),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]).default("Available"),
  region: z.string().trim().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { error } = await authorize("fleet", "view");
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const type = sp.get("type");
  const region = sp.get("region");
  const q = sp.get("q");
  const available = sp.get("available");
  const where: Record<string, unknown> = {};
  if (available === "1") where.status = "Available";
  else if (status) where.status = status;
  if (type) where.type = type;
  if (region) where.region = region;
  if (q) where.OR = [{ registrationNumber: { contains: q } }, { name: { contains: q } }];
  const vehicles = await prisma.vehicle.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({ vehicles });
}

export async function POST(req: NextRequest) {
  const { error } = await authorize("fleet", "manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return badRequest("Please check the vehicle details", parsed.error.flatten());
  try {
    const vehicle = await prisma.vehicle.create({
      data: { ...parsed.data, region: parsed.data.region || null },
    });
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (e) {
    if (isUniqueError(e)) return conflict("A vehicle with this registration number already exists");
    throw e;
  }
}
