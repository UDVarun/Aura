import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_PREFIX = "/admin";
const VENDOR_PREFIX = "/vendor";
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isVendorRoute = pathname.startsWith(VENDOR_PREFIX);
    const isVendorRoot = pathname === VENDOR_PREFIX || pathname === `${VENDOR_PREFIX}/`;

    // Refresh the Supabase session on every request (required by @supabase/ssr)
    const { supabaseResponse, user, supabase } = await updateSession(request);

    // Faster role resolution: trust the cookie primarily to avoid blocking DB queries on every request.
    let role = request.cookies.get("role")?.value ?? null;

    // Strict check for protected routes or if cookie is missing but user is logged in
    const isProtectedRoute = pathname.startsWith(ADMIN_PREFIX) || isVendorRoute;
    if (user && (!role || isProtectedRoute)) {
        const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
        role = data?.role ?? "customer";

        // Sync legacy role cookie for client-side awareness
        supabaseResponse.cookies.set("role", role ?? "customer", {
            path: "/",
            sameSite: "strict",
            httpOnly: false,
        });
    } else if (!user) {
        // Clear role cookie when logged out
        supabaseResponse.cookies.set("role", "", {
            path: "/",
            maxAge: 0,
        });
        role = null;
    }

    // 1. Protect Admin routes
    if (pathname.startsWith(ADMIN_PREFIX)) {
        if (!user || role !== "admin") {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            loginUrl.searchParams.set("required", "admin");
            return NextResponse.redirect(loginUrl);
        }
    }

    // 2. Protect Vendor routes
    if (isVendorRoute) {
        const { data: vendor } = user
            ? await supabase.from("vendors").select("status").eq("user_id", user.id).single()
            : { data: null };

        if (!user) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            loginUrl.searchParams.set("required", "vendor");
            return NextResponse.redirect(loginUrl);
        }

        if (role !== "vendor") {
            return NextResponse.redirect(new URL("/become-vendor", request.url));
        }

        const isApprovedVendor = vendor?.status === "approved";

        // Allow vendor accounts to open the dashboard root even while pending/rejected.
        // Management sub-routes remain restricted to approved vendors only.
        if (!isVendorRoot && !isApprovedVendor) {
            return NextResponse.redirect(new URL("/become-vendor", request.url));
        }
    }

    // 3. Redirect already-logged-in users away from auth pages
    if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && user) {
        const dashboardMap: Record<string, string> = {
            admin: "/admin",
            vendor: "/vendor",
            customer: "/",
        };
        return NextResponse.redirect(
            new URL(dashboardMap[role ?? "customer"] ?? "/", request.url)
        );
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
