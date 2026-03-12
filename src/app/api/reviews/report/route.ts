import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const payload = await request.json();

        if (!payload.reviewId || !payload.reason) {
            return NextResponse.json({ error: "reviewId and reason are required." }, { status: 400 });
        }

        const { error } = await supabase
            .from("review_reports")
            .upsert(
                {
                    review_id: payload.reviewId,
                    reporter_id: user.id,
                    reason: payload.reason,
                    status: "pending"
                },
                { onConflict: "review_id,reporter_id" }
            );

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: "Review reported successfully." });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to report review.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
