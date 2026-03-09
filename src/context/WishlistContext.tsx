"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export type WishlistContextValue = {
    wishlistIds: string[];
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    isLoading: boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [wishlistIds, setWishlistIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !user) {
            setWishlistIds([]);
            setIsLoading(false);
            return;
        }

        const fetchWishlist = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("wishlists")
                .select("product_id")
                .eq("user_id", user.id);

            if (!error && data) {
                setWishlistIds(data.map((row) => row.product_id));
            }
            setIsLoading(false);
        };

        fetchWishlist();
    }, [user, isAuthenticated, authLoading, supabase]);

    const toggleWishlist = useCallback(
        async (productId: string) => {
            if (!isAuthenticated || !user) {
                // Enforce wishlist restriction to logged-in users and redirect
                router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                return;
            }

            const isCurrentlyLiked = wishlistIds.includes(productId);

            // Optimistic UI update
            if (isCurrentlyLiked) {
                setWishlistIds((prev) => prev.filter((id) => id !== productId));

                // Remove from DB securely
                await supabase
                    .from("wishlists")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("product_id", productId);
            } else {
                setWishlistIds((prev) => [...prev, productId]);

                // Add to DB securely
                await supabase
                    .from("wishlists")
                    .insert({
                        user_id: user.id,
                        product_id: productId,
                    });
            }
        },
        [user, isAuthenticated, wishlistIds, supabase, router, pathname]
    );

    const isInWishlist = useCallback(
        (productId: string) => {
            return wishlistIds.includes(productId);
        },
        [wishlistIds]
    );

    const value = useMemo(
        () => ({
            wishlistIds,
            toggleWishlist,
            isInWishlist,
            isLoading,
        }),
        [wishlistIds, toggleWishlist, isInWishlist, isLoading]
    );

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
    return ctx;
}
