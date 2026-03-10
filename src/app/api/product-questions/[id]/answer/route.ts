import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabase(request);
        const { user, role } = await requireRole(supabase, ["vendor", "admin"]);
        const { id } = await params;
        const payload = await request.json();

        if (!payload.answer) {
            return NextResponse.json({ error: "Answer is required." }, { status: 400 });
        }

        const query = supabase
            .from("product_questions")
            .update({
                answer: payload.answer.trim(),
                answered_by: user.id,
                answered_at: new Date().toISOString(),
                status: "answered",
            })
            .eq("id", id);

        const scopedQuery = role === "vendor" ? query.eq("vendor_id", user.id) : query;
        const { data, error } = await scopedQuery
            .select("id, question, answer, status, created_at, answered_at")
            .single();

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? "Question not found." }, { status: 404 });
        }

        return NextResponse.json({ question: data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to answer question.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
