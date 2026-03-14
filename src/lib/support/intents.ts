import type { SupportDecision, SupportIntent } from "@/lib/support/types";

const INTENT_PATTERNS: Array<{ intent: SupportIntent; patterns: RegExp[] }> = [
  { intent: "refund_request", patterns: [/refund/i, /money back/i, /charged/i] },
  { intent: "return_request", patterns: [/return/i, /exchange/i, /replacement/i] },
  { intent: "order_status", patterns: [/where.*order/i, /track/i, /delivery/i, /shipment/i, /order status/i] },
  { intent: "account_help", patterns: [/login/i, /password/i, /account/i, /address/i, /email/i] },
  { intent: "vendor_dispute", patterns: [/seller/i, /vendor/i, /fraud/i, /scam/i, /not as described/i] },
  { intent: "troubleshooting", patterns: [/broken/i, /damaged/i, /not working/i, /issue/i, /problem/i] },
  { intent: "knowledge_lookup", patterns: [/policy/i, /how do i/i, /help/i, /faq/i] },
];

export function classifyIntent(message: string): SupportIntent {
  for (const entry of INTENT_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(message))) {
      return entry.intent;
    }
  }

  return "agent_handoff";
}

export function decideSupportPath(input: {
  message: string;
  articleCount: number;
  orderCount: number;
}): SupportDecision {
  const intent = classifyIntent(input.message);
  const usedAI = shouldUseAI({
    intent,
    kbHits: input.articleCount,
    message: input.message,
    orderCount: input.orderCount,
  });

  const confidence =
    intent === "agent_handoff"
      ? 0.3
      : input.articleCount > 0 || input.orderCount > 0
        ? 0.86
        : 0.58;

  const shouldEscalate =
    intent === "vendor_dispute" ||
    intent === "agent_handoff" ||
    (input.articleCount === 0 && intent !== "order_status");

  return {
    intent,
    shouldEscalate,
    usedAI,
    confidence,
  };
}

export function shouldUseAI(input: {
  intent: SupportIntent;
  kbHits: number;
  message: string;
  orderCount?: number;
}) {
  if (input.intent === "order_status" && (input.orderCount ?? 0) > 0) return false;
  if (input.kbHits > 0 && input.message.length < 400 && input.intent !== "agent_handoff") return false;
  return true;
}
