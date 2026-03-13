import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase(request);
        const { id } = await params;

        const { data, error } = await supabase
            .from("support_case_activities")
            .select("*")
            .eq("case_id", id)
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ activities: data ?? [] });
    } catch (error) {
        return NextResponse.json({ error: "Unable to load activities" }, { status: 500 });
    }
}
