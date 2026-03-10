import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["vendor"]);

        const { data, error } = await supabase
            .from("order_items")
            .select("id, product_title, quantity, line_total, status, shipment_status, tracking_number, created_at, orders(order_number, shipping_address)")
            .eq("vendor_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ orderItems: data ?? [] });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch vendor orders.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
