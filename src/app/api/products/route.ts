import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedActor } from "@/lib/marketplace";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user, role } = await getAuthenticatedActor(supabase);

        if (!user) {
            return NextResponse.json({ error: "Authentication required." }, { status: 401 });
        }

        if (role !== "vendor" && role !== "admin") {
            return NextResponse.json({ error: "Only vendors and admins can create products." }, { status: 403 });
        }

        const payload = await request.json();
        const productPayload = {
            title: payload.title,
            description: payload.description ?? null,
            price: Number(payload.price),
            stock_quantity: Number(payload.stock_quantity),
            category_id: payload.category_id || null,
            image_url: payload.image_url || null,
            is_featured: Boolean(payload.is_featured),
            vendor_id: role === "admin" ? payload.vendor_id ?? user.id : user.id,
        };

        const { data: product, error } = await supabase
            .from("products")
            .insert(productPayload)
            .select("id")
            .single();

        if (error || !product) {
            return NextResponse.json({ error: error?.message || "Product creation failed" }, { status: 400 });
        }

        // 2. Handle Multiple Images
        if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
            const imageRecords = payload.images.map((img: any, index: number) => ({
                product_id: product.id,
                url: typeof img === 'string' ? img : img.url,
                alt_text: typeof img === 'string' ? null : img.alt_text || null,
                display_order: typeof img === 'string' ? index : img.display_order ?? index
            }));

            const { error: imgError } = await supabase
                .from("product_images")
                .insert(imageRecords);
            
            if (imgError) {
                console.error("[API/PRODUCTS] Error inserting images:", imgError);
                // We don't fail the whole request because the product was created
            }
        }

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create product.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user, role } = await getAuthenticatedActor(supabase);

        if (!user) {
            return NextResponse.json({ error: "Authentication required." }, { status: 401 });
        }

        if (role !== "vendor" && role !== "admin") {
            return NextResponse.json({ error: "Only vendors and admins can update products." }, { status: 403 });
        }

        const payload = await request.json();
        if (!payload.id) {
            return NextResponse.json({ error: "Product id is required." }, { status: 400 });
        }

        const updatePayload = {
            title: payload.title,
            description: payload.description ?? null,
            price: Number(payload.price),
            stock_quantity: Number(payload.stock_quantity),
            category_id: payload.category_id || null,
            image_url: payload.image_url || null,
            is_featured: Boolean(payload.is_featured),
            ...(payload.vendor_id ? { vendor_id: payload.vendor_id } : {}),
        };

        let query = supabase
            .from("products")
            .update(updatePayload)
            .eq("id", payload.id);

        if (role === "vendor") {
            query = query.eq("vendor_id", user.id);
        }

        const { data: product, error } = await query.select("id").single();

        if (error || !product) {
            return NextResponse.json({ error: error?.message || "Product update failed" }, { status: 400 });
        }

        // 2. Update Multiple Images (Delete old and insert new for simplicity in sync)
        if (payload.images && Array.isArray(payload.images)) {
            // Delete old images - attempt gracefully
            const { error: delError } = await supabase
                .from("product_images")
                .delete()
                .eq("product_id", product.id);
            
            if (delError) {
                console.warn("[API/PRODUCTS] Note: Could not delete old images (table might be missing):", delError.message);
            }

            if (payload.images.length > 0) {
                const imageRecords = payload.images.map((img: any, index: number) => ({
                    product_id: product.id,
                    url: typeof img === 'string' ? img : img.url,
                    alt_text: typeof img === 'string' ? null : img.alt_text || null,
                    display_order: typeof img === 'string' ? index : img.display_order ?? index
                }));

                const { error: imgError } = await supabase
                    .from("product_images")
                    .insert(imageRecords);
                
                if (imgError) {
                    console.error("[API/PRODUCTS] Error updating images:", imgError.message);
                }
            }
        }

        return NextResponse.json({ product });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update product.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
