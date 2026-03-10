import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createServerSupabase(request);

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Get the user to determine their role for redirect
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const requestedRole = requestUrl.searchParams.get("role");
                const finalRole = (requestedRole === "vendor" || requestedRole === "customer")
                    ? requestedRole
                    : "customer";

                // Look up the user's current role
                const { data: roleData } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                let role = roleData?.role;

                // If no role exists (new user), or if a specific role was requested and user is not an admin
                if (!role || (requestedRole && role !== "admin")) {
                    const upsertRole = role === "admin" ? "admin" : finalRole;
                    await supabase.from("profiles").upsert({
                        id: user.id,
                        email: user.email,
                        role: upsertRole,
                    });
                    role = upsertRole;
                }

                // Redirect based on role (unless a specific redirect was requested)
                if (next !== "/") {
                    return NextResponse.redirect(new URL(next, requestUrl.origin));
                }

                const roleRedirects: Record<string, string> = {
                    admin: "/admin",
                    vendor: "/vendor",
                    customer: "/",
                };

                return NextResponse.redirect(
                    new URL(roleRedirects[role] ?? "/", requestUrl.origin)
                );
            }
        }
    }

    // Return to home on error
    return NextResponse.redirect(
        new URL(`/?error=auth_callback_failed`, requestUrl.origin)
    );
}
