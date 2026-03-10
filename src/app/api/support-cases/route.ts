import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatCaseNumber, requireRole } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user, role } = await requireRole(supabase, ["customer", "vendor", "admin"]);

        let query = supabase
            .from("support_cases")
            .select("id, case_number, category, subject, status, priority, created_at, updated_at, last_message_at, order_id, vendor_id, resolution")
            .order("last_message_at", { ascending: false });

        if (role === "customer") query = query.eq("customer_id", user.id);
        if (role === "vendor") query = query.eq("vendor_id", user.id);

        const { data, error } = await query;
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ cases: data ?? [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load cases.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer"]);
        const payload = await request.json();

        if (!payload.subject || !payload.description || !payload.category) {
            return NextResponse.json({ error: "Subject, category, and description are required." }, { status: 400 });
        }

        let vendorId = payload.vendorId ?? null;
        if (!vendorId && payload.orderItemId) {
            const { data: orderItem } = await supabase
                .from("order_items")
                .select("vendor_id")
                .eq("id", payload.orderItemId)
                .eq("customer_id", user.id)
                .single();
            vendorId = orderItem?.vendor_id ?? null;
        }
        if (!vendorId && payload.orderId) {
            const { data: orderItems } = await supabase
                .from("order_items")
                .select("vendor_id")
                .eq("order_id", payload.orderId)
                .eq("customer_id", user.id);

            const vendorIds = Array.from(new Set((orderItems ?? []).map((item) => item.vendor_id).filter(Boolean)));
            if (vendorIds.length === 1) {
                vendorId = vendorIds[0];
            }
        }

        const caseNumber = formatCaseNumber();
        const { data: supportCase, error } = await supabase
            .from("support_cases")
            .insert({
                case_number: caseNumber,
                order_id: payload.orderId ?? null,
                order_item_id: payload.orderItemId ?? null,
                product_id: payload.productId ?? null,
                customer_id: user.id,
                vendor_id: vendorId,
                category: payload.category,
                subject: payload.subject.trim(),
                description: payload.description.trim(),
                priority: payload.priority ?? "normal",
                status: vendorId ? "waiting_for_vendor" : "open",
            })
            .select("id, case_number, category, subject, status, priority, created_at, updated_at, last_message_at")
            .single();

        if (error || !supportCase) {
            return NextResponse.json({ error: error?.message ?? "Unable to create support case." }, { status: 400 });
        }

        const { error: messageError } = await supabase
            .from("support_case_messages")
            .insert({
                case_id: supportCase.id,
                sender_id: user.id,
                sender_role: "customer",
                body: payload.description.trim(),
            });

        if (messageError) {
            return NextResponse.json({ error: messageError.message }, { status: 400 });
        }

        return NextResponse.json({ supportCase }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create support case.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
