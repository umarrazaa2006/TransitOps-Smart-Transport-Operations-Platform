import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "transitops_session";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "transitops-insecure-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    return {
      sub: String(payload.sub ?? ""),
      email: String((payload as Record<string, unknown>).email ?? ""),
      name: String((payload as Record<string, unknown>).name ?? ""),
      role: String((payload as Record<string, unknown>).role ?? ""),
    };
  } catch {
    return null;
  }
}
