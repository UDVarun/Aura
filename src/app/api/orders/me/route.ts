import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer"]);

        const { data, error } = await supabase
            .from("orders")
            .select("id, order_number, status, total_amount, placed_at, shipping_address, order_items(id, product_title, quantity, line_total, status, shipment_status)")
            .eq("customer_id", user.id)
            .order("placed_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ orders: data ?? [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch orders.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
