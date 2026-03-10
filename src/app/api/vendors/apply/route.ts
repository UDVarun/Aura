import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabase(request);
    const {
        data: { user },
        error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const {
        store_name,
        store_description,
        phone,
        address,
        business_category,
        government_id,
        gst_number,
    } = await request.json();

    const { error } = await supabase
        .from("vendors")
        .upsert(
            {
                user_id: user.id,
                store_name,
                store_description,
                phone,
                address,
                business_category,
                government_id,
                gst_number,
                status: "pending",
                review_notes: null,
            },
            { onConflict: "user_id" }
        );

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
