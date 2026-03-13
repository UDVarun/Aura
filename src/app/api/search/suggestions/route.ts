import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
    MIN_SUGGESTION_QUERY_LENGTH,
    sanitizeSearchQuery,
    type SearchBrandSuggestion,
    type SearchCategorySuggestion,
    type SearchKeywordSuggestion,
    type SearchProductSuggestion,
    type SearchSuggestionResponse,
    type SearchTrendingSuggestion,
} from "@/lib/search";

type ProductRow = {
    id: string;
    title: string;
    image_url: string | null;
    price: number | string | null;
    brand: string | null;
    avg_rating: number | null;
    review_count: number | null;
    categories: { name: string | null; slug: string | null } | { name: string | null; slug: string | null }[] | null;
};

function asNumber(value: number | string | null | undefined) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function normalizeCategory(categories: ProductRow["categories"]) {
    if (Array.isArray(categories)) {
        return categories[0] ?? null;
    }

    return categories ?? null;
}

function toProductSuggestion(product: ProductRow): SearchProductSuggestion {
    const category = normalizeCategory(product.categories);
    const brand = product.brand?.trim() || null;

    return {
        id: product.id,
        kind: "product",
        title: product.title,
        imageUrl: product.image_url,
        price: asNumber(product.price),
        brand,
        categoryName: category?.name ?? null,
        categorySlug: category?.slug ?? null,
        rating: asNumber(product.avg_rating),
        reviewCount: Math.max(0, Math.trunc(asNumber(product.review_count))),
        sellerLabel: brand ? `${brand} seller` : "Aura seller",
    };
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = getKey(item);
        if (!key || seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function buildCompletion(query: string, products: SearchProductSuggestion[], categories: SearchCategorySuggestion[], brands: SearchBrandSuggestion[], keywords: SearchKeywordSuggestion[]) {
    const queryLower = query.toLowerCase();
    const candidates = [
        ...products.map((item) => item.title),
        ...keywords.map((item) => item.term),
        ...categories.map((item) => item.name),
        ...brands.map((item) => item.name),
    ];

    const match = candidates.find((candidate) => candidate.toLowerCase().startsWith(queryLower) && candidate.length > query.length);
    return match ?? null;
}

function buildKeywordSuggestions(query: string, products: SearchProductSuggestion[], categories: SearchCategorySuggestion[], brands: SearchBrandSuggestion[]) {
    const queryLower = query.toLowerCase();
    const phrases = [
        ...products.map((item) => item.title),
        ...products.flatMap((item) => [item.categoryName, item.brand].filter(Boolean) as string[]),
        ...categories.map((item) => item.name),
        ...brands.map((item) => item.name),
    ];

    const keywords = phrases
        .map((term) => term.trim())
        .filter((term) => term.toLowerCase().includes(queryLower))
        .slice(0, 8)
        .map<SearchKeywordSuggestion>((term) => ({
            id: `keyword:${term.toLowerCase()}`,
            kind: "keyword",
            term,
        }));

    return uniqueBy(keywords, (item) => item.id).slice(0, 4);
}

function buildTrendingSuggestions(products: SearchProductSuggestion[]) {
    const items: SearchTrendingSuggestion[] = [];

    for (const product of products) {
        items.push({
            id: `trend:product:${product.id}`,
            kind: "trending",
            term: product.title,
            source: "product",
        });

        if (product.categoryName) {
            items.push({
                id: `trend:category:${product.categoryName.toLowerCase()}`,
                kind: "trending",
                term: product.categoryName,
                source: "category",
            });
        }

        if (product.brand) {
            items.push({
                id: `trend:brand:${product.brand.toLowerCase()}`,
                kind: "trending",
                term: product.brand,
                source: "brand",
            });
        }
    }

    return uniqueBy(items, (item) => item.id).slice(0, 8);
}

export async function GET(request: NextRequest) {
    try {
        const query = sanitizeSearchQuery(request.nextUrl.searchParams.get("q"));
        const supabase = await createServerSupabase();

        if (query.length < MIN_SUGGESTION_QUERY_LENGTH) {
            const { data: trendingRows, error: trendingError } = await supabase
                .from("products")
                .select("id, title, image_url, price, brand, avg_rating, review_count, categories(name, slug)")
                .order("is_featured", { ascending: false })
                .order("review_count", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(8);

            if (trendingError) {
                throw trendingError;
            }

            const trendingProducts = (trendingRows ?? []).map((row) => toProductSuggestion(row as ProductRow));
            const response: SearchSuggestionResponse = {
                query,
                completion: null,
                products: [],
                categories: [],
                brands: [],
                keywords: [],
                trending: buildTrendingSuggestions(trendingProducts),
            };

            return NextResponse.json(response, {
                headers: {
                    "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
                },
            });
        }

        const pattern = `%${query}%`;

        const [titleProductResult, brandMatchedProductResult, categoryResult, brandResult] = await Promise.all([
            supabase
                .from("products")
                .select("id, title, image_url, price, brand, avg_rating, review_count, categories(name, slug)")
                .ilike("title", pattern)
                .order("is_featured", { ascending: false })
                .order("review_count", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(6),
            supabase
                .from("products")
                .select("id, title, image_url, price, brand, avg_rating, review_count, categories(name, slug)")
                .ilike("brand", pattern)
                .order("is_featured", { ascending: false })
                .order("review_count", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(4),
            supabase
                .from("categories")
                .select("id, name, slug")
                .ilike("name", pattern)
                .order("name")
                .limit(4),
            supabase
                .from("products")
                .select("brand")
                .ilike("brand", pattern)
                .limit(8),
        ]);

        if (titleProductResult.error) {
            throw titleProductResult.error;
        }

        if (brandMatchedProductResult.error) {
            throw brandMatchedProductResult.error;
        }

        if (categoryResult.error) {
            throw categoryResult.error;
        }

        if (brandResult.error) {
            throw brandResult.error;
        }

        const products = uniqueBy(
            [...(titleProductResult.data ?? []), ...(brandMatchedProductResult.data ?? [])].map((row) => toProductSuggestion(row as ProductRow)),
            (item) => item.id,
        ).slice(0, 6);

        const categories = uniqueBy(
            (categoryResult.data ?? []).map<SearchCategorySuggestion>((item) => ({
                id: item.id,
                kind: "category",
                name: item.name,
                slug: item.slug,
            })),
            (item) => item.id,
        );

        const brands = uniqueBy(
            (brandResult.data ?? [])
                .map((item) => item.brand?.trim())
                .filter((item): item is string => Boolean(item))
                .map<SearchBrandSuggestion>((name) => ({
                    id: `brand:${name.toLowerCase()}`,
                    kind: "brand",
                    name,
                })),
            (item) => item.id,
        ).slice(0, 4);

        const keywords = buildKeywordSuggestions(query, products, categories, brands);

        const response: SearchSuggestionResponse = {
            query,
            completion: buildCompletion(query, products, categories, brands, keywords),
            products,
            categories,
            brands,
            keywords,
            trending: [],
        };

        return NextResponse.json(response, {
            headers: {
                "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
            },
        });
    } catch (error) {
        console.error("[API/SEARCH/SUGGESTIONS] Error:", error);
        return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }
}
