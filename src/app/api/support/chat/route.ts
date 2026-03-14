import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request);
    const { user, role } = await requireRole(supabase, ["customer", "admin"]);

    let query = supabase
      .from("support_conversations")
      .select("id, customer_id, assigned_agent_id, ticket_id, status, last_message_at, created_at")
      .order("last_message_at", { ascending: false })
      .limit(20);

    if (role === "customer") {
      query = query.eq("customer_id", user.id);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ conversations: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load conversations.";
    const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request);
    const { user } = await requireRole(supabase, ["customer"]);
    const payload = await request.json().catch(() => ({}));

    const { data, error } = await supabase
      .from("support_conversations")
      .insert({
        customer_id: user.id,
        status: payload.status ?? "pending_ai",
        channel: payload.channel ?? "chat",
      })
      .select("id, customer_id, assigned_agent_id, ticket_id, status, last_message_at, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ conversation: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create conversation.";
    const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
