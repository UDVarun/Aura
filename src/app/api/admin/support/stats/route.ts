import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabase();

  // 1. Get ticket counts by status
  const { data: statusCounts } = await supabase
    .from("support_cases")
    .select("status");

  // 2. Get recent feedback (CSAT)
  const { data: feedback } = await supabase
    .from("support_feedback")
    .select("rating")
    .limit(100);

  // 3. Process data
  const stats = {
    total: statusCounts?.length || 0,
    open: statusCounts?.filter(s => s.status === 'open').length || 0,
    waiting: statusCounts?.filter(s => s.status === 'waiting_for_vendor').length || 0,
    resolved: statusCounts?.filter(s => s.status === 'resolved').length || 0,
    csat: feedback && feedback.length > 0 
      ? (feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length).toFixed(1) 
      : "N/A"
  };

  return NextResponse.json(stats);
}
