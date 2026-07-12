import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { can, type Resource } from "@/lib/rbac";

const PATH_RESOURCE: { prefix: string; resource: Resource }[] = [
  { prefix: "/dashboard", resource: "dashboard" },
  { prefix: "/fleet", resource: "fleet" },
  { prefix: "/drivers", resource: "drivers" },
  { prefix: "/trips", resource: "trips" },
  { prefix: "/maintenance", resource: "maintenance" },
  { prefix: "/expenses", resource: "expenses" },
  { prefix: "/analytics", resource: "analytics" },
  { prefix: "/settings", resource: "settings" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const isLogin = pathname === "/login";

  if (!session) {
    if (isLogin) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin || pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const match = PATH_RESOURCE.find(
    (p) => pathname === p.prefix || pathname.startsWith(p.prefix + "/")
  );
  if (match && !can(session.role, match.resource, "view")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
