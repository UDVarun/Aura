"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";

export interface VendorOrder {
    id: string;
    product_title: string;
    quantity: number;
    line_total: number;
    status: string;
    shipment_status: string;
    created_at: string;
    orders: {
        order_number: string;
        shipping_address: any;
    };
}

export interface VendorProduct {
    id: string;
    title: string;
    price: number;
    stock_quantity: number;
    image_url: string;
    created_at: string;
    avg_rating?: number;
    review_count?: number;
}

export interface VendorReview {
    id: string;
    product_id: string;
    rating: number;
    title: string;
    body: string;
    created_at: string;
    is_verified: boolean;
    profiles: { email: string };
    products: { title: string };
}

interface VendorContextType {
    orders: VendorOrder[];
    products: VendorProduct[];
    reviews: VendorReview[];
    loading: boolean;
    refreshData: () => Promise<void>;
    stats: {
        totalRevenue: number;
        totalOrders: number;
        productCount: number;
        lowStockItems: number;
        averageRating: number;
    };
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export function VendorProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [products, setProducts] = useState<VendorProduct[]>([]);
    const [reviews, setReviews] = useState<VendorReview[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = useCallback(async () => {
        if (!user || user.role !== "vendor") return;

        setLoading(true);
        try {
            const [ordersRes, productsRes] = await Promise.all([
                supabase
                    .from("order_items")
                    .select("id, product_title, quantity, line_total, status, shipment_status, created_at, orders(order_number, shipping_address)")
                    .eq("vendor_id", user.id)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("products")
                    .select("*")
                    .eq("vendor_id", user.id)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("product_reviews")
                    .select("*, profiles:customer_id(email), products:product_id(title)")
                    .in("product_id", products.map(p => p.id))
                    .order("created_at", { ascending: false })
                    .limit(20)
            ]);

            if (ordersRes.data) setOrders(ordersRes.data as any);
            if (productsRes.data) setProducts(productsRes.data as any);
            if (productsRes.data && productsRes.data.length > 0) {
                // If we have products, fetch their reviews (since the initial fetch might fail if product list changed)
                const { data: reviewsData } = await supabase
                    .from("product_reviews")
                    .select("*, profiles:customer_id(email), products:product_id(title)")
                    .in("product_id", productsRes.data.map((p: any) => p.id))
                    .order("created_at", { ascending: false })
                    .limit(20);
                if (reviewsData) setReviews(reviewsData as any);
            }
        } catch (error) {
            console.error("Error fetching vendor data:", error);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        if (isAuthenticated && user?.role === "vendor") {
            refreshData();

            // Subscribe to order items for this vendor
            const ordersSubscription = supabase
                .channel(`vendor-orders-${user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "order_items",
                        filter: `vendor_id=eq.${user.id}`,
                    },
                    () => refreshData()
                )
                .subscribe();

            // Subscribe to products for this vendor
            const productsSubscription = supabase
                .channel(`vendor-products-${user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "products",
                        filter: `vendor_id=eq.${user.id}`,
                    },
                    () => refreshData()
                )
                .subscribe();

            return () => {
                supabase.removeChannel(ordersSubscription);
                supabase.removeChannel(productsSubscription);
            };
        } else {
            setOrders([]);
            setProducts([]);
            setLoading(false);
        }
    }, [user, isAuthenticated, refreshData, supabase]);

    const stats = React.useMemo(() => {
        const totalRevenue = orders.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
        const lowStockItems = products.filter(p => Number(p.stock_quantity) < 5).length;
        
        const productsWithRating = products.filter(p => p.avg_rating && p.avg_rating > 0);
        const averageRating = productsWithRating.length > 0 
            ? productsWithRating.reduce((sum, p) => sum + (p.avg_rating || 0), 0) / productsWithRating.length
            : 0;

        return {
            totalRevenue,
            totalOrders: orders.length,
            productCount: products.length,
            lowStockItems,
            averageRating
        };
    }, [orders, products]);

    return (
        <VendorContext.Provider value={{ orders, products, reviews, loading, refreshData, stats }}>
            {children}
        </VendorContext.Provider>
    );
}

export function useVendor() {
    const context = useContext(VendorContext);
    if (context === undefined) {
        throw new Error("useVendor must be used within a VendorProvider");
    }
    return context;
}
