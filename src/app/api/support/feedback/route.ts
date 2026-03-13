import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const { user } = await requireRole(supabase, ["customer"]);
    const { caseId, rating, comment } = await request.json();

    if (!caseId || !rating) {
      return NextResponse.json({ error: "Case ID and rating are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("support_feedback")
      .insert({
        case_id: caseId,
        user_id: user.id,
        rating,
        comment
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ feedback: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}
