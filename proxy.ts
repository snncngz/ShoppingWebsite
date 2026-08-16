import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/server/auth/constants";
import { verifySessionToken } from "@/server/auth/token";
import { getPrisma } from "@/server/db/prisma";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/giris" || pathname.startsWith("/admin/giris/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET?.trim();
  const session =
    token && secret ? await verifySessionToken(token, secret) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/admin/giris", request.url));
  }

  const user = await getPrisma().user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
