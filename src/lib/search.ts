export const MAX_SEARCH_QUERY_LENGTH = 64;
export const MIN_SUGGESTION_QUERY_LENGTH = 2;
export const MAX_RECENT_SEARCHES = 6;

export type SearchSuggestionKind = "product" | "category" | "brand" | "keyword" | "recent" | "trending";

export interface SearchProductSuggestion {
    id: string;
    kind: "product";
    title: string;
    imageUrl: string | null;
    price: number;
    brand: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    rating: number;
    reviewCount: number;
    sellerLabel: string;
}

export interface SearchCategorySuggestion {
    id: string;
    kind: "category";
    name: string;
    slug: string | null;
}

export interface SearchBrandSuggestion {
    id: string;
    kind: "brand";
    name: string;
}

export interface SearchKeywordSuggestion {
    id: string;
    kind: "keyword";
    term: string;
}

export interface SearchTrendingSuggestion {
    id: string;
    kind: "trending";
    term: string;
    source: "product" | "category" | "brand";
}

export interface SearchSuggestionResponse {
    query: string;
    completion: string | null;
    products: SearchProductSuggestion[];
    categories: SearchCategorySuggestion[];
    brands: SearchBrandSuggestion[];
    keywords: SearchKeywordSuggestion[];
    trending: SearchTrendingSuggestion[];
}

export function sanitizeSearchQuery(rawValue: string | null | undefined) {
    const value = (rawValue ?? "")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/[%_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return value.slice(0, MAX_SEARCH_QUERY_LENGTH);
}

export function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
