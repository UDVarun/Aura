import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category");

  const supabase = await createServerSupabase();

  let dbQuery = supabase
    .from("support_articles")
    .select("id, title, slug, category, tags, view_count")
    .eq("is_published", true);

  if (query) {
    dbQuery = dbQuery.textSearch("fts", query, {
      type: "websearch",
      config: "english",
    });
  }

  if (category) {
    dbQuery = dbQuery.eq("category", category);
  }

  const { data, error } = await dbQuery.order("view_count", { ascending: false }).limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data });
}
