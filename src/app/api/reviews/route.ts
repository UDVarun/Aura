import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
    const supabase = await createServerSupabase(request);
    const productId = new URL(request.url).searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("product_reviews")
        .select("id, rating, title, body, created_at")
        .eq("product_id", productId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer"]);
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
                    title: payload.title?.trim() ?? null,
                    body: payload.body?.trim() ?? null,
                    status: "published",
                },
                { onConflict: "product_id,customer_id,order_item_id" }
            )
            .select("id, rating, title, body, created_at")
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
