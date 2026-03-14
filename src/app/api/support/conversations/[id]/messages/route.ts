import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/marketplace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase(request);
    await requireRole(supabase, ["customer", "admin"]);
    const { id } = await params;

    const { data, error } = await supabase
      .from("support_messages")
      .select("id, sender_id, sender_role, content, metadata, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load messages.";
    const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase(request);
    const { user, role } = await requireRole(supabase, ["customer", "admin"]);
    const { id } = await params;
    const payload = await request.json();

    if (!payload.content) {
      return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }

    const senderRole = role === "admin" ? "agent" : "customer";
    const { data, error } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: id,
        sender_id: user.id,
        sender_role: senderRole,
        content: payload.content.trim(),
        metadata: payload.metadata ?? {},
      })
      .select("id, sender_id, sender_role, content, metadata, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase
      .from("support_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send message.";
    const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
