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

        // Log status change activity
        await supabase
            .from("support_case_activities")
            .insert({
                case_id: id,
                type: "status_changed",
                message: `Status updated to ${payload.status.replace(/_/g, " ")} by ${role}.`,
                actor_id: user.id
            });

        // Notify participants
        const { data: caseData } = await supabase
            .from("support_cases")
            .select("customer_id, vendor_id, case_number")
            .eq("id", id)
            .single();

        if (caseData) {
            const recipients = [];
            if (role === "admin") {
                recipients.push(caseData.customer_id);
                if (caseData.vendor_id) recipients.push(caseData.vendor_id);
            } else if (role === "vendor") {
                recipients.push(caseData.customer_id);
            } else if (role === "customer" && caseData.vendor_id) {
                recipients.push(caseData.vendor_id);
            }

            if (recipients.length > 0) {
                const notifications = recipients.map(uid => ({
                    user_id: uid,
                    title: `Case ${caseData.case_number} Updated`,
                    message: `The status of your support case has been updated to ${payload.status.replace(/_/g, " ")}.`,
                    type: "support"
                }));
                await supabase.from("notifications").insert(notifications);
            }
        }

        return NextResponse.json({ supportCase: data });


    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update support case.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
