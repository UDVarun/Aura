import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const payload = await request.json();

        if (!payload.reviewId || !payload.voteType) {
            return NextResponse.json({ error: "reviewId and voteType are required." }, { status: 400 });
        }

        const { error } = await supabase
            .from("review_votes")
            .upsert(
                {
                    review_id: payload.reviewId,
                    user_id: user.id,
                    vote_type: payload.voteType,
                },
                { onConflict: "review_id,user_id" }
            );

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Fetch updated counts
        const { data: review, error: fetchError } = await supabase
            .from("product_reviews")
            .select("helpful_count, unhelpful_count")
            .eq("id", payload.reviewId)
            .single();

        return NextResponse.json({ 
            message: "Vote recorded.",
            helpful_count: review?.helpful_count ?? 0,
            unhelpful_count: review?.unhelpful_count ?? 0
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to record vote.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const reviewId = new URL(request.url).searchParams.get("reviewId");

        if (!reviewId) {
            return NextResponse.json({ error: "reviewId is required." }, { status: 400 });
        }

        const { error } = await supabase
            .from("review_votes")
            .delete()
            .eq("review_id", reviewId)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const { data: review } = await supabase
            .from("product_reviews")
            .select("helpful_count, unhelpful_count")
            .eq("id", reviewId)
            .single();

        return NextResponse.json({ 
            message: "Vote removed.",
            helpful_count: review?.helpful_count ?? 0,
            unhelpful_count: review?.unhelpful_count ?? 0
        });
    } catch (error) {
        return NextResponse.json({ error: "Unable to remove vote." }, { status: 500 });
    }
}
