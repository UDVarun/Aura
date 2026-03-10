import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const VALID_STATUSES = ["approved", "rejected", "suspended"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createServerSupabase(request);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { status } = await request.json();
    if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: vendor, error } = await supabase
        .from("vendors")
        .select("user_id")
        .eq("id", id)
        .single();

    if (error || !vendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const updateResponse = await supabase
        .from("vendors")
        .update({ status })
        .eq("id", id);

    if (updateResponse.error) {
        return NextResponse.json({ error: updateResponse.error.message }, { status: 400 });
    }

    const profileStatus = status === "approved" ? "vendor" : "customer";
    await supabase
        .from("profiles")
        .update({ role: profileStatus })
        .eq("id", vendor.user_id);

    return NextResponse.json({ success: true });
}
