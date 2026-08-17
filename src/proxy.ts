import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Optimistic check only (cookie-derived, no DB hit) — the real security boundary is
// requireSession()/requireRole() in src/lib/auth/guard.ts, called from every protected Server
// Action and Server Component. See docs/ARCHITECTURE.md §3.
const PROTECTED_PREFIXES = ["/dashboard", "/doctor", "/admin"];

function homeFor(role: string) {
  if (role === "DOCTOR") return "/doctor";
  if (role === "HOSPITAL_ADMIN") return "/admin/hospital";
  if (role === "PLATFORM_STAFF" || role === "PLATFORM_ADMIN") return "/admin/platform";
  return "/dashboard";
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/register") && req.auth) {
    return NextResponse.redirect(new URL(homeFor(req.auth.user.role), req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)"],
};
