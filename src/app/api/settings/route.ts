import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest } from "@/lib/api";

async function getOrCreate() {
  const existing = await prisma.setting.findUnique({ where: { id: "global" } });
  if (existing) return existing;
  return prisma.setting.create({ data: { id: "global" } });
}

export async function GET() {
  const { error } = await authorize("settings", "view");
  if (error) return error;
  const setting = await getOrCreate();
  return NextResponse.json({ setting });
}

const updateSchema = z.object({
  depotName: z.string().trim().min(1).optional(),
  currency: z.string().trim().min(1).optional(),
  distanceUnit: z.string().trim().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  const { error } = await authorize("settings", "manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Please check the settings", parsed.error.flatten());
  await getOrCreate();
  const setting = await prisma.setting.update({ where: { id: "global" }, data: parsed.data });
  return NextResponse.json({ setting });
}
