import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { can, type AccessLevel, type Resource } from "./rbac";
import type { SessionPayload } from "./session";
import { prisma } from "./prisma";

type AuthResult = { error: NextResponse; session: null } | { error: null; session: SessionPayload };

export async function authorize(
  resource: Resource,
  level: AccessLevel = "view"
): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (!can(session.role, resource, level)) {
    return {
      error: NextResponse.json({ error: "You do not have access to this action" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError(message = "Something went wrong") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function isUniqueError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

export async function nextTripCode(): Promise<string> {
  const trips = await prisma.trip.findMany({ select: { tripCode: true } });
  let max = 0;
  for (const t of trips) {
    const n = parseInt(t.tripCode.replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return "TR" + String(max + 1).padStart(3, "0");
}
