import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase(request);
        const { user, role } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const { id } = await params;
        const payload = await request.json();

        if (!payload.status) {
            return NextResponse.json({ error: "Status is required." }, { status: 400 });
        }

        let query = supabase
            .from("support_cases")
            .update({
                status: payload.status,
                resolution: payload.resolution ?? null,
                assigned_admin_id: role === "admin" ? user.id : undefined,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (role === "customer") query = query.eq("customer_id", user.id);
        if (role === "vendor") query = query.eq("vendor_id", user.id);

        const { data, error } = await query
            .select("id, case_number, category, subject, status, priority, created_at, updated_at, last_message_at, resolution")
            .single();

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? "Support case not found." }, { status: 404 });
        }

        return NextResponse.json({ supportCase: data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update support case.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
