import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  const { user } = await requireRole(supabase, ["vendor"]);

  // 1. Get vendor-specific ticket counts
  const { data: cases } = await supabase
    .from("support_cases")
    .select("status")
    .eq("vendor_id", user.id);

  // 2. Process stats
  const stats = {
    total: cases?.length || 0,
    active: cases?.filter(c => ['open', 'waiting_for_vendor', 'under_review'].includes(c.status)).length || 0,
    resolved: cases?.filter(c => c.status === 'resolved').length || 0,
    waiting: cases?.filter(c => c.status === 'waiting_for_vendor').length || 0
  };

  return NextResponse.json(stats);
}
