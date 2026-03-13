import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabase();
  
  // 1. Fetch CSAT data
  const { data: csatData } = await supabase
    .from("support_feedback")
    .select("rating, created_at");

  // 2. Fetch Agent performance
  const { data: agents } = await supabase
    .from("support_agents")
    .select("full_name, rating, active_cases_count");

  // 3. Status distribution (Simplified SLA simulation)
  const { data: cases } = await supabase
    .from("support_cases")
    .select("status, priority, created_at, last_message_at");

  // Calculate trends and metrics
  const totalCSAT = csatData?.reduce((acc, curr) => acc + curr.rating, 0) || 0;
  const avgCSAT = csatData?.length ? (totalCSAT / csatData.length).toFixed(1) : "5.0";

  const statusCounts = cases?.reduce((acc: any, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const priorityCounts = cases?.reduce((acc: any, curr) => {
    acc[curr.priority] = (acc[curr.priority] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    avgCSAT,
    csatCount: csatData?.length || 0,
    statusCounts: statusCounts || {},
    priorityCounts: priorityCounts || {},
    agents: agents || [],
    recentFeedback: csatData?.slice(-5) || []
  });
}
