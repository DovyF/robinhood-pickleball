import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/enums";

// Gate /admin behind staff roles. Account dashboard is gated in its layout.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) {
    const role = req.auth?.user?.role;
    if (!req.auth?.user) {
      const url = new URL("/account/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!role || !STAFF_ROLES.includes(role)) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
