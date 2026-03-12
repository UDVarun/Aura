import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createServerSupabase(request);
        await requireRole(supabase, ["admin"]);
        const payload = await request.json();

        // Resolve all reports for this review
        const { error } = await supabase
            .from("review_reports")
            .update({ status: payload.status || "resolved" })
            .eq("review_id", id);

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ message: "Reports updated." });
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createServerSupabase(request);
        await requireRole(supabase, ["admin"]);

        const { error } = await supabase
            .from("product_reviews")
            .delete()
            .eq("id", id);

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ message: "Review deleted." });
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
}
