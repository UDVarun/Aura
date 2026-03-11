import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Handle the OAuth callback from Supabase.
 * This route exchanges the 'code' for a session and handles profile setup.
 */
export async function GET(request: NextRequest) {
    const { origin, searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";
    const requestedRole = searchParams.get("role") as "customer" | "vendor" | null;

    console.log(`[AUTH] Callback started. Code: ${code ? "YES" : "NO"}, Next: ${next}, Role: ${requestedRole}`);

    if (!code) {
        console.warn("[AUTH] No code found in callback. Redirecting to home.");
        return NextResponse.redirect(new URL("/", origin));
    }

    try {
        const supabase = await createServerSupabase(request);
        
        // 1. Exchange the PKCE code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
            console.error("[AUTH] Code exchange failed:", exchangeError);
            return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(exchangeError.message)}`, origin));
        }

        const user = data.user;
        if (!user) {
            console.error("[AUTH] No user found in session data after exchange.");
            return NextResponse.redirect(new URL("/?error=no_user_in_session", origin));
        }

        console.log(`[AUTH] Session established for user: ${user.email} (ID: ${user.id})`);

        // 2. Ensure profile exists and has the correct role
        // We look up the existing role first
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        let role = profile?.role;
        console.log(`[AUTH] Current profile role: ${role || "NEW_USER"}`);

        // If it's a new profile or if the role needs updating (and they're not an admin)
        if (!role || (requestedRole && role !== "admin" && role !== requestedRole)) {
            const finalRole = (role === "admin") ? "admin" : (requestedRole || "customer");
            console.log(`[AUTH] Setting/updating profile role to: ${finalRole}`);
            
            const { error: upsertError } = await supabase.from("profiles").upsert({
                id: user.id,
                email: user.email,
                role: finalRole,
            });

            if (upsertError) {
                console.error("[AUTH] Profile upsert failed:", upsertError);
                // We continue anyway, they just won't have the profile role yet
            } else {
                role = finalRole;
            }
        }

        // 3. Final redirect
        // Priority: custom 'next' param (if safe) -> role-based dashboard -> home
        const dashboardMap: Record<string, string> = {
            admin: "/admin",
            vendor: "/vendor",
            customer: "/",
        };

        let targetPath = (dashboardMap[role || "customer"] || "/");
        if (next && typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
            targetPath = next;
        }

        console.log(`[AUTH] Success! Redirecting to: ${targetPath}`);
        return NextResponse.redirect(new URL(targetPath, origin));

    } catch (err) {
        console.error("[AUTH] Unexpected exception in callback route:", err);
        return NextResponse.redirect(new URL("/?error=unexpected_auth_error", origin));
    }
}
