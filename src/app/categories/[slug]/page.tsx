import { redirect } from "next/navigation";

const SLUG_TO_QUERY: Record<string, string> = {
  electronics: "tech",
  tech: "tech",
  fashion: "fashion",
  audio: "audio",
  home: "home",
  decor: "decor",
  wearables: "wearables",
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoryQuery = SLUG_TO_QUERY[slug?.toLowerCase()] ?? "all";
  redirect(categoryQuery === "all" ? "/products" : `/products?category=${categoryQuery}`);
}
