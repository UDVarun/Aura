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
        .from("product_questions")
        .select("id, question, answer, status, created_at, answered_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer", "vendor", "admin"]);
        const payload = await request.json();

        if (!payload.productId || !payload.question) {
            return NextResponse.json({ error: "Product and question are required." }, { status: 400 });
        }

        const { data: product, error: productError } = await supabase
            .from("products")
            .select("id, vendor_id")
            .eq("id", payload.productId)
            .single();

        if (productError || !product?.vendor_id) {
            return NextResponse.json({ error: "Product not found." }, { status: 404 });
        }

        const { data, error } = await supabase
            .from("product_questions")
            .insert({
                product_id: payload.productId,
                customer_id: user.id,
                vendor_id: product.vendor_id,
                question: payload.question.trim(),
                status: "open",
            })
            .select("id, question, answer, status, created_at, answered_at")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ question: data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to submit question.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
