import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createClient();

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Get the user to determine their role for redirect
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                // Look up the user's role
                const { data: roleData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                const role = roleData?.role ?? "customer";

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
