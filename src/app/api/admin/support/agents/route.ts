import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabase();
  
  const { data, error } = await supabase
    .from("support_agents")
    .select("*")
    .order("full_name");
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const body = await request.json();
  
  // body should contain id, full_name, etc.
  // Note: id must be a valid user id from public.profiles
  const { data, error } = await supabase
    .from("support_agents")
    .upsert(body)
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
