import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that checks for the session token cookie
// Full auth validation happens in Server Components via auth()
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - always accessible
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for session token (set by NextAuth)
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Root redirect (role-based redirect happens in page.tsx)
  if (pathname === "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
