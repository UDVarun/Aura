import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        await requireRole(supabase, ["admin"]);

        const { data, error } = await supabase
            .from("product_reviews")
            .select(`
                *,
                profiles:customer_id (id, email),
                products:product_id (id, title),
                review_reports (reason, status, reporter_id)
            `)
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ reviews: data });
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
}
