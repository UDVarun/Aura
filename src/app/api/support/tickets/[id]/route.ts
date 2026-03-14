import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase(request);
    const { user, role } = await requireRole(supabase, ["customer", "admin"]);
    const { id } = await params;

    let query = supabase
      .from("support_tickets")
      .select("*")
      .eq("id", id);

    if (role === "customer") {
      query = query.eq("customer_id", user.id);
    }

    const { data, error } = await query.single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ ticket: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load ticket.";
    const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase(request);
    await requireRole(supabase, ["admin"]);
    const { id } = await params;
    const payload = await request.json();

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.status) update.status = payload.status;
    if (payload.assignedAgentId !== undefined) update.assigned_agent_id = payload.assignedAgentId;
    if (payload.priority) update.priority = payload.priority;
    if (payload.status === "RESOLVED") update.resolved_at = new Date().toISOString();
    if (payload.firstResponseAt) update.first_response_at = payload.firstResponseAt;

    const { data, error } = await supabase
      .from("support_tickets")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ticket: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update ticket.";
    const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
