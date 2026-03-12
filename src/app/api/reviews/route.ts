import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
    const supabase = await createServerSupabase(request);
    const searchParams = new URL(request.url).searchParams;
    const productId = searchParams.get("productId");
    const sort = searchParams.get("sort") || "top"; // top, recent, rating_high, rating_low, verified

    if (!productId) {
        return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    let query = supabase
        .from("product_reviews")
        .select(`
            id, rating, title, body, created_at, media_urls, helpful_count, is_verified, weighted_score,
            profiles:customer_id (id, email)
        `)
        .eq("product_id", productId)
        .eq("status", "published");

    if (sort === "recent") {
        query = query.order("created_at", { ascending: false });
    } else if (sort === "rating_high") {
        query = query.order("rating", { ascending: false });
    } else if (sort === "rating_low") {
        query = query.order("rating", { ascending: true });
    } else if (sort === "verified") {
        query = query.eq("is_verified", true).order("created_at", { ascending: false });
    } else {
        // Default "top": weighted score then helpful count
        query = query.order("weighted_score", { ascending: false }).order("helpful_count", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const payload = await request.json();

        if (!payload.productId || !payload.rating) {
            return NextResponse.json({ error: "Product and rating are required." }, { status: 400 });
        }

        const { data: orderItem, error: orderItemError } = await supabase
            .from("order_items")
            .select("id")
            .eq("customer_id", user.id)
            .eq("product_id", payload.productId)
            .eq("status", "delivered")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (orderItemError) {
            return NextResponse.json({ error: orderItemError.message }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("product_reviews")
            .upsert(
                {
                    product_id: payload.productId,
                    customer_id: user.id,
                    order_item_id: orderItem?.id ?? null,
                    rating: Number(payload.rating),
                    title: payload.title?.trim() || null,
                    body: payload.body?.trim() || null,
                    media_urls: payload.mediaUrls || [],
                    is_verified: !!orderItem,
                    weighted_score: !!orderItem ? Number(payload.rating) * 1.2 : Number(payload.rating),
                    status: "published",
                },
                { onConflict: "product_id,customer_id" }
            )
            .select("id, rating, title, body, created_at, media_urls, helpful_count, is_verified")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ review: data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save review.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
