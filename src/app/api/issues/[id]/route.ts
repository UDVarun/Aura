import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase(request);
        const { user, role } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const { id } = await params;

        const { data: issue, error } = await supabase
            .from("issues")
            .select(`
                id, subject, description, status, priority, created_at, updated_at, 
                user_id, vendor_id, order_id, product_id,
                customer:profiles!user_id(full_name, avatar_url),
                seller:profiles!vendor_id(full_name, avatar_url),
                product:products(title, image_url),
                order:orders(order_number, total_amount),
                messages:issue_messages(*, sender:profiles(full_name, avatar_url)),
                history:issue_status_history(*)
            `)
            .eq("id", id)
            .single();

        if (error || !issue) {
            return NextResponse.json({ error: "Issue not found" }, { status: 404 });
        }

        // Check accessibility
        if (role === "customer" && issue.user_id !== user.id) throw new Error("Forbidden");
        if (role === "vendor" && issue.vendor_id !== user.id) throw new Error("Forbidden");

        return NextResponse.json({ issue });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase(request);
        const { user, role } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        // Get issue to verify permissions
        const { data: issue } = await supabase
            .from("issues")
            .select("user_id, vendor_id, status")
            .eq("id", id)
            .single();

        if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Authorization checks for status change
        if (role === "customer") {
            if (issue.user_id !== user.id) throw new Error("Forbidden");
            // Customers can only close or potentially escalate if logic allows
            if (!["CLOSED", "ESCALATED"].includes(status)) {
                throw new Error("Invalid status transition for customer");
            }
        } else if (role === "vendor") {
            if (issue.vendor_id !== user.id) throw new Error("Forbidden");
            if (!["VENDOR_REVIEW", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
                 throw new Error("Invalid status transition for vendor");
            }
        }

        const { error } = await supabase
            .from("issues")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Record history
        await supabase
            .from("issue_status_history")
            .insert({
                issue_id: id,
                status,
                changed_by: user.id
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
