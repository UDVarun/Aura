import type { SupabaseClient, User } from "@supabase/supabase-js";

export type MarketplaceRole = "customer" | "vendor" | "admin";

export async function getProfileRole(supabase: SupabaseClient, userId: string): Promise<MarketplaceRole> {
    const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    return (data?.role as MarketplaceRole | undefined) ?? "customer";
}

export async function getAuthenticatedActor(supabase: SupabaseClient) {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { user: null, role: null as MarketplaceRole | null };
    }

    const role = await getProfileRole(supabase, user.id);
    return { user, role };
}

export async function requireRole(
    supabase: SupabaseClient,
    allowedRoles: MarketplaceRole[]
): Promise<{ user: User; role: MarketplaceRole }> {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Authentication required");
    }

    const role = await getProfileRole(supabase, user.id);
    if (!allowedRoles.includes(role)) {
        throw new Error("Forbidden");
    }

    return { user, role };
}

export function formatCaseNumber() {
    return `CASE-${Date.now().toString().slice(-8)}`;
}

export function formatOrderNumber() {
    return `AUR-${Date.now().toString().slice(-8)}`;
}
