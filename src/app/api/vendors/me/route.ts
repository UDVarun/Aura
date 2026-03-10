import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createServerSupabase(request);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ vendor: null }, { status: 200 });
    }

    const { data: vendor } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .single();

    return NextResponse.json({ vendor: vendor ?? null });
}
