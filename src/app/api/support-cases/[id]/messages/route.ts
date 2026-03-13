import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase(request);
        await requireRole(supabase, ["customer", "vendor", "admin"]);
        const { id } = await params;

        const { data, error } = await supabase
            .from("support_case_messages")
            .select("id, sender_role, body, is_internal, created_at")
            .eq("case_id", id)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ messages: data ?? [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load case messages.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase(request);
        const { user, role } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const { id } = await params;
        const payload = await request.json();

        if (!payload.body) {
            return NextResponse.json({ error: "Message body is required." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("support_case_messages")
            .insert({
                case_id: id,
                sender_id: user.id,
                sender_role: role,
                body: payload.body.trim(),
                is_internal: role === "admin" ? Boolean(payload.isInternal) : false,
            })
            .select("id, sender_role, body, is_internal, created_at")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Log Activity
        await supabase
            .from("support_case_activities")
            .insert({
                case_id: id,
                type: "message_sent",
                message: `${role.charAt(0).toUpperCase() + role.slice(1)} sent a message.`,
                actor_id: user.id
            });

        // Determine recipient and send notification
        const { data: caseData } = await supabase
            .from("support_cases")
            .select("customer_id, vendor_id, assigned_admin_id, case_number")
            .eq("id", id)
            .single();

        if (caseData) {
            const recipients = [];
            if (role === "customer") {
                if (caseData.vendor_id) recipients.push(caseData.vendor_id);
                if (caseData.assigned_admin_id) recipients.push(caseData.assigned_admin_id);
            } else if (role === "vendor") {
                recipients.push(caseData.customer_id);
                if (caseData.assigned_admin_id) recipients.push(caseData.assigned_admin_id);
            } else if (role === "admin") {
                recipients.push(caseData.customer_id);
                if (caseData.vendor_id) recipients.push(caseData.vendor_id);
            }

            if (recipients.length > 0) {
                const notifications = recipients.map(uid => ({
                    user_id: uid,
                    title: `New message in Case ${caseData.case_number}`,
                    message: `${role.charAt(0).toUpperCase() + role.slice(1)} replied to your support case.`,
                    type: "support"
                }));
                await supabase.from("notifications").insert(notifications);
            }
        }

        await supabase
            .from("support_cases")
            .update({
                last_message_at: new Date().toISOString(),
                status: role === "customer" ? "waiting_for_vendor" : role === "vendor" ? "waiting_for_customer" : payload.status ?? "open",
            })
            .eq("id", id);



        return NextResponse.json({ message: data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to send case message.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
