import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_PREFIX = "/admin";
const VENDOR_PREFIX = "/vendor";
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Refresh the Supabase session on every request (required by @supabase/ssr)
    const { supabaseResponse, user, supabase } = await updateSession(request);

    // Fetch role from user_roles table if user is logged in
    let role: string | null = null;
    if (user) {
        const { data } = await supabase
            .from("user_roles")
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
    } else {
        // Clear role cookie when logged out
        supabaseResponse.cookies.set("role", "", {
            path: "/",
            maxAge: 0,
        });
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
    if (pathname.startsWith(VENDOR_PREFIX)) {
        if (!user || role !== "vendor") {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            loginUrl.searchParams.set("required", "vendor");
            return NextResponse.redirect(loginUrl);
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
