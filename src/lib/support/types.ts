export type SupportIntent =
  | "order_status"
  | "refund_request"
  | "return_request"
  | "account_help"
  | "troubleshooting"
  | "vendor_dispute"
  | "knowledge_lookup"
  | "agent_handoff";

export type KnowledgeArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content?: string;
  tags?: string[];
  view_count?: number;
};

export type SupportOrderSummary = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at?: string;
  placed_at?: string;
};

export type SupportDecision = {
  intent: SupportIntent;
  shouldEscalate: boolean;
  usedAI: boolean;
  confidence: number;
};
