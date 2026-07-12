import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, badRequest } from "@/lib/api";

const createSchema = z.object({
  type: z.string().trim().min(1),
  amount: z.coerce.number().nonnegative(),
  description: z.string().trim().optional().nullable(),
  date: z.coerce.date().optional(),
  vehicleId: z.string().optional().nullable(),
  tripId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { error } = await authorize("expenses", "view");
  if (error) return error;
  const q = req.nextUrl.searchParams.get("q");
  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { type: { contains: q } },
      { description: { contains: q } },
      { vehicle: { name: { contains: q } } },
    ];
  }
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: { vehicle: true, trip: true },
  });
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const { error } = await authorize("expenses", "manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return badRequest("Please check the expense details", parsed.error.flatten());
  const d = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      type: d.type,
      amount: d.amount,
      description: d.description || null,
      date: d.date ?? new Date(),
      vehicleId: d.vehicleId || null,
      tripId: d.tripId || null,
    },
  });
  return NextResponse.json({ expense }, { status: 201 });
}
