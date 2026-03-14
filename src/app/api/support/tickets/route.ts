import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request);
    const { user, role } = await requireRole(supabase, ["customer", "admin"]);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("support_tickets")
      .select("id, customer_id, assigned_agent_id, order_id, title, intent, status, priority, source, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (role === "customer") {
      query = query.eq("customer_id", user.id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(50);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ tickets: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load tickets.";
    const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request);
    const { user } = await requireRole(supabase, ["customer"]);
    const payload = await request.json();

    if (!payload.title || !payload.description || !payload.intent) {
      return NextResponse.json({ error: "Title, description, and intent are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        customer_id: user.id,
        conversation_id: payload.conversationId ?? null,
        order_id: payload.orderId ?? null,
        title: payload.title.trim(),
        description: payload.description.trim(),
        intent: payload.intent,
        priority: payload.priority ?? "NORMAL",
        status: "OPEN",
        source: payload.source ?? "chat",
      })
      .select("id, title, status, priority, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ticket: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create ticket.";
    const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
