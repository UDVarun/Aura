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

    /*
    // Some Supabase/provider configurations return OAuth users to `/` with `?code=...`.
    // Normalize those requests through our dedicated callback route so session exchange always happens.
    if (request.nextUrl.searchParams.get("code") && pathname !== "/auth/callback") {
        const callbackUrl = request.nextUrl.clone();
        callbackUrl.pathname = "/auth/callback";
        return NextResponse.redirect(callbackUrl);
    }
    */

    // Refresh the Supabase session on every request
    const { supabaseResponse, user, supabase } = await updateSession(request);

    // Faster role resolution: trust the cookie primarily to avoid blocking DB queries
    let role = request.cookies.get("role")?.value ?? null;

    // Strict check for protected routes
    const isProtectedRoute = pathname.startsWith(ADMIN_PREFIX) || isVendorRoute;
    
    if (user) {
        if (!role || isProtectedRoute) {
            const { data } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            role = data?.role ?? "customer";

            // Sync role cookie for client-side awareness
            supabaseResponse.cookies.set("role", role as string, {
                path: "/",
                sameSite: "lax",
                httpOnly: false,
                maxAge: 31536000, 
            });
        }
    } else {
        if (role) {
            supabaseResponse.cookies.set("role", "", { path: "/", maxAge: 0 });
            role = null;
        }
    }

    // 1. Protect Admin routes
    if (pathname.startsWith(ADMIN_PREFIX)) {
        if (!user) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            loginUrl.searchParams.set("required", "admin");
            return NextResponse.redirect(loginUrl);
        }
        if (role !== "admin") {
            // Redirect to their own dashboard instead of a loop
            const dashboardMap: Record<string, string> = {
                vendor: "/vendor",
                customer: "/",
            };
            return NextResponse.redirect(new URL(dashboardMap[role as string] ?? "/", request.url));
        }
    }

    // 2. Protect Vendor routes
    if (isVendorRoute) {
        if (!user) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            loginUrl.searchParams.set("required", "vendor");
            return NextResponse.redirect(loginUrl);
        }

        if (role !== "vendor" && role !== "admin") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Allow admins to access vendor routes too for cross-testing
        if (role === "admin") {
             return supabaseResponse;
        }

        const { data: vendor } = await supabase
            .from("vendors")
            .select("status")
            .eq("user_id", user.id)
            .single();

        const isApprovedVendor = vendor?.status === "approved" || vendor?.status === "pending"; // Allow pending for testing
        if (!isVendorRoot && !isApprovedVendor) {
            return NextResponse.redirect(new URL("/become-vendor", request.url));
        }
    }

    // 3. Auth routes redirect
    if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && user) {
        const requestedRedirect = request.nextUrl.searchParams.get("redirect");
        if (requestedRedirect?.startsWith("/")) {
            return NextResponse.redirect(new URL(requestedRedirect, request.url));
        }
        const dashboardMap: Record<string, string> = {
            admin: "/admin",
            vendor: "/vendor",
            customer: "/",
        };
        return NextResponse.redirect(new URL(dashboardMap[role ?? "customer"] ?? "/", request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
