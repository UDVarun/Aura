"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { parsePriceValue } from "@/lib/currency";
import { useRouter, usePathname } from "next/navigation";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
};

type AddCartItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: AddCartItemInput) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isOpen: boolean;
  openCart: () => void;
  isInCart: (productId: string) => boolean;
  closeCart: () => void;
  isCartLoading: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();


  const fetchCart = useCallback(async () => {
    if (!user) return;

    setIsCartLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(
        data.map((row) => ({
          id: row.product_id,
          name: row.product_name,
          price: parsePriceValue(row.product_price),
          image: row.product_image,
          category: row.product_category,
          quantity: row.quantity,
        }))
      );
    }

    setIsCartLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      queueMicrotask(() => {
        setItems([]);
        setIsCartLoading(false);
      });
      return;
    }

    void fetchCart();
  }, [authLoading, fetchCart, isAuthenticated, user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`cart-items-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` },
        () => void fetchCart()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchCart, supabase, user]);

  const addItem = useCallback(
    async (input: AddCartItemInput) => {
      if (!isAuthenticated || !user) {
        console.warn("[CART] addItem blocked: user not authenticated.", { isAuthenticated, userId: user?.id });
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      const qty = Math.max(1, input.quantity ?? 1);
      const existingItem = items.find((p) => p.id === input.id);
      const newTotalQty = existingItem ? existingItem.quantity + qty : qty;

      // Optimistic UI update
      setItems((prev) => {
        const existing = prev.find((p) => p.id === input.id);
        if (existing) {
          return prev.map((p) =>
            p.id === input.id ? { ...p, quantity: newTotalQty } : p
          );
        }
        return [...prev, { ...input, quantity: qty }];
      });
      setIsOpen(true);

      // Persist to secure DB cart (Row Level Security protected)
      console.log(`[CART] Attempting DB upsert for product ${input.id}. User: ${user.id}`);
      const { error } = await supabase
        .from("cart_items")
        .upsert(
          {
            user_id: user.id,
            product_id: input.id,
            product_name: input.name,
            product_price: input.price,
            product_image: input.image,
            product_category: input.category,
            quantity: newTotalQty,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,product_id",
          }
        );

      if (error) {
        console.error("[CART] Failed to add item to DB cart. Detailed Error:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          full_error: error
        });
      } else {
        console.log("[CART] Successfully persisted item to DB.");
      }
    },
    [user, isAuthenticated, items, supabase, router, pathname]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!user) return;

      // Optimistic UI update
      setItems((prev) => prev.filter((p) => p.id !== id));

      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", id);
    },
    [user, supabase]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (!user) return;

      if (quantity <= 0) {
        return removeItem(id);
      }

      // Optimistic UI update
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity } : p)));

      await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", user.id)
        .eq("product_id", id);
    },
    [user, removeItem, supabase]
  );

  const clearCart = useCallback(async () => {
    if (!user) return;

    // Optimistic UI update
    setItems([]);

    await supabase.from("cart_items").delete().eq("user_id", user.id);
  }, [user, supabase]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const isInCart = (productId: string) => {
        return items.some((item) => item.id === productId);
    };

    return {
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isOpen,
      openCart,
      closeCart,
      isCartLoading,
      isInCart,
    };
  }, [
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isOpen,
    openCart,
    closeCart,
    isCartLoading,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
