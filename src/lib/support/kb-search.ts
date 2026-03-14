import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeArticle } from "@/lib/support/types";

export async function searchSupportArticles(
  supabase: SupabaseClient,
  query: string,
  limit = 5
): Promise<KnowledgeArticle[]> {
  const search = query.trim();
  if (!search) return [];

  const { data, error } = await supabase
    .from("support_articles")
    .select("id, title, slug, category, content, tags, view_count")
    .eq("is_published", true)
    .textSearch("fts", search, {
      type: "websearch",
      config: "english",
    })
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as KnowledgeArticle[];
}
