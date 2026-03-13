import { MAX_RECENT_SEARCHES, sanitizeSearchQuery } from "@/lib/search";

const MAX_HISTORY_ITEMS = 12;

type SearchUserProfile = {
    recentSearches: string[];
    viewedProducts: string[];
    viewedCategories: string[];
    purchasedTerms: string[];
};

function getScopedKey(baseKey: string, userId?: string) {
    return `${baseKey}:${userId ?? "guest"}`;
}

function readStringArray(key: string) {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return [];
    }
}

function writeStringArray(key: string, values: string[]) {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(values));
    } catch {
        return;
    }
}

function upsertValue(values: string[], value: string, limit: number) {
    const normalized = sanitizeSearchQuery(value);
    if (!normalized) {
        return values;
    }

    return [normalized, ...values.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, limit);
}

export function getRecentSearchStorageKey(userId?: string) {
    return getScopedKey("aura:recent-searches", userId);
}

export function getViewedProductsStorageKey(userId?: string) {
    return getScopedKey("aura:viewed-products", userId);
}

export function getViewedCategoriesStorageKey(userId?: string) {
    return getScopedKey("aura:viewed-categories", userId);
}

export function getPurchasedTermsStorageKey(userId?: string) {
    return getScopedKey("aura:purchased-terms", userId);
}

export function loadSearchUserProfile(userId?: string): SearchUserProfile {
    const recentSearches = [
        ...readStringArray(getRecentSearchStorageKey(userId)),
        ...readStringArray(getRecentSearchStorageKey()),
    ].filter((value, index, values) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);

    const viewedProducts = [
        ...readStringArray(getViewedProductsStorageKey(userId)),
        ...readStringArray(getViewedProductsStorageKey()),
    ].filter((value, index, values) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);

    const viewedCategories = [
        ...readStringArray(getViewedCategoriesStorageKey(userId)),
        ...readStringArray(getViewedCategoriesStorageKey()),
    ].filter((value, index, values) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);

    const purchasedTerms = [
        ...readStringArray(getPurchasedTermsStorageKey(userId)),
        ...readStringArray(getPurchasedTermsStorageKey()),
    ].filter((value, index, values) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);

    return {
        recentSearches,
        viewedProducts,
        viewedCategories,
        purchasedTerms,
    };
}

export function saveRecentSearches(values: string[], userId?: string) {
    writeStringArray(getRecentSearchStorageKey(userId), values.slice(0, MAX_RECENT_SEARCHES));
}

export function removeRecentSearch(value: string, userId?: string) {
    const nextValues = readStringArray(getRecentSearchStorageKey(userId)).filter((item) => item.toLowerCase() !== value.toLowerCase());
    writeStringArray(getRecentSearchStorageKey(userId), nextValues);
    return nextValues;
}

export function clearRecentSearchesStorage(userId?: string) {
    writeStringArray(getRecentSearchStorageKey(userId), []);
}

export function recordViewedProduct(title: string, userId?: string) {
    const key = getViewedProductsStorageKey(userId);
    const nextValues = upsertValue(readStringArray(key), title, MAX_HISTORY_ITEMS);
    writeStringArray(key, nextValues);
}

export function recordViewedCategory(category: string, userId?: string) {
    const key = getViewedCategoriesStorageKey(userId);
    const nextValues = upsertValue(readStringArray(key), category, MAX_HISTORY_ITEMS);
    writeStringArray(key, nextValues);
}

export function persistPurchasedTerms(terms: string[], userId?: string) {
    const normalized = terms
        .map((term) => sanitizeSearchQuery(term))
        .filter(Boolean)
        .slice(0, MAX_HISTORY_ITEMS);
    writeStringArray(getPurchasedTermsStorageKey(userId), normalized);
}
