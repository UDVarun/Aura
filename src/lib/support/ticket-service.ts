import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupportIntent } from "@/lib/support/types";

type EnsureTicketParams = {
  supabase: SupabaseClient;
  userId: string;
  conversationId: string;
  message: string;
  intent: SupportIntent;
};

export async function ensureSupportTicket({
  supabase,
  userId,
  conversationId,
  message,
  intent,
}: EnsureTicketParams) {
  const existing = await supabase
    .from("support_tickets")
    .select("id, status")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data;
  }

  const title = buildTicketTitle(intent, message);
  const priority = intent === "vendor_dispute" ? "HIGH" : intent === "refund_request" ? "NORMAL" : "LOW";

  const created = await supabase
    .from("support_tickets")
    .insert({
      conversation_id: conversationId,
      customer_id: userId,
      title,
      description: message.trim(),
      intent,
      priority,
      status: "OPEN",
      source: "chat",
    })
    .select("id, status, title, priority")
    .single();

  return created.data ?? null;
}

function buildTicketTitle(intent: SupportIntent, message: string) {
  const prefixMap: Record<SupportIntent, string> = {
    order_status: "Order status follow-up",
    refund_request: "Refund request",
    return_request: "Return request",
    account_help: "Account support",
    troubleshooting: "Troubleshooting help",
    vendor_dispute: "Vendor dispute",
    knowledge_lookup: "Help center escalation",
    agent_handoff: "General support request",
  };

  return `${prefixMap[intent]}: ${message.trim().slice(0, 64)}`;
}
