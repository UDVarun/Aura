import type { SupabaseClient } from "@supabase/supabase-js";
import { decideSupportPath } from "@/lib/support/intents";
import { searchSupportArticles } from "@/lib/support/kb-search";
import { ensureSupportTicket } from "@/lib/support/ticket-service";
import type { KnowledgeArticle, SupportOrderSummary } from "@/lib/support/types";

type RunSupportFlowParams = {
  supabase: SupabaseClient;
  userId: string;
  conversationId: string;
  message: string;
};

export async function runSupportFlow({
  supabase,
  userId,
  conversationId,
  message,
}: RunSupportFlowParams) {
  const [articles, orders] = await Promise.all([
    searchSupportArticles(supabase, message, 3),
    getRecentOrders(supabase, userId),
  ]);

  const decision = decideSupportPath({
    message,
    articleCount: articles.length,
    orderCount: orders.length,
  });

  const reply = buildReply({
    intent: decision.intent,
    articles,
    orders,
    shouldEscalate: decision.shouldEscalate,
  });

  await supabase.from("support_messages").insert([
    {
      conversation_id: conversationId,
      sender_id: userId,
      sender_role: "customer",
      content: message.trim(),
      metadata: { source: "web_chat" },
    },
    {
      conversation_id: conversationId,
      sender_role: "ai",
      content: reply,
      metadata: {
        intent: decision.intent,
        confidence: decision.confidence,
        used_ai: decision.usedAI,
      },
    },
  ]);

  await supabase
    .from("support_conversations")
    .update({
      status: decision.shouldEscalate ? "waiting_agent" : "active",
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  const ticket = decision.shouldEscalate
    ? await ensureSupportTicket({
        supabase,
        userId,
        conversationId,
        message,
        intent: decision.intent,
      })
    : null;

  return {
    reply,
    ticket,
    decision,
    articles,
    orders,
  };
}

async function getRecentOrders(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, created_at, placed_at")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []) as SupportOrderSummary[];
}

function buildReply(input: {
  intent: string;
  articles: KnowledgeArticle[];
  orders: SupportOrderSummary[];
  shouldEscalate: boolean;
}) {
  if (input.intent === "order_status" && input.orders[0]) {
    const order = input.orders[0];
    return `Your latest order #${order.order_number} is currently ${order.status}. If you need vendor action or a refund review, I can open a tracked support ticket from this chat.`;
  }

  if (input.articles[0]) {
    const article = input.articles[0];
    const excerpt = (article.content ?? "").replace(/\s+/g, " ").trim().slice(0, 320);
    return `${article.title}: ${excerpt}${excerpt.length >= 320 ? "..." : ""} If that does not resolve it, I can escalate this conversation to a support agent.`;
  }

  if (input.shouldEscalate) {
    return "I could not resolve this confidently from Aura's knowledge base or your recent account data, so I am escalating it into the support queue for human follow-up.";
  }

  return "I found partial context for your request. Please share the order number or product name if you want a more precise answer.";
}
