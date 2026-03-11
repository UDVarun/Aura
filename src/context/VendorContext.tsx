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
}

interface VendorContextType {
    orders: VendorOrder[];
    products: VendorProduct[];
    loading: boolean;
    refreshData: () => Promise<void>;
    stats: {
        totalRevenue: number;
        totalOrders: number;
        productCount: number;
        lowStockItems: number;
    };
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export function VendorProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [products, setProducts] = useState<VendorProduct[]>([]);
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
                    .order("created_at", { ascending: false })
            ]);

            if (ordersRes.data) setOrders(ordersRes.data as any);
            if (productsRes.data) setProducts(productsRes.data as any);
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

        return {
            totalRevenue,
            totalOrders: orders.length,
            productCount: products.length,
            lowStockItems
        };
    }, [orders, products]);

    return (
        <VendorContext.Provider value={{ orders, products, loading, refreshData, stats }}>
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
