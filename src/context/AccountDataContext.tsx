"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

type AccountProfile = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
};

export type UserAddress = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

export type AccountOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  placed_at: string;
};

type AccountDataContextValue = {
  profile: AccountProfile | null;
  addresses: UserAddress[];
  orders: AccountOrder[];
  isLoading: boolean;
  refreshAccountData: () => Promise<void>;
};

const AccountDataContext = createContext<AccountDataContextValue | null>(null);

const emptyProfile: AccountProfile = {
  first_name: null,
  last_name: null,
  phone: null,
  address: null,
  city: null,
  state: null,
  zip: null,
  country: null,
};

export function AccountDataProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccountData = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setAddresses([]);
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [profileResult, addressResult, ordersResult] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      user.role === "customer"
        ? fetch("/api/orders/me", { cache: "no-store" }).then(async (response) => {
            if (!response.ok) {
              return { orders: [] as AccountOrder[] };
            }

            return (await response.json()) as { orders?: AccountOrder[] };
          })
        : Promise.resolve({ orders: [] as AccountOrder[] }),
    ]);

    setProfile(profileResult.data ?? emptyProfile);
    setAddresses(addressResult.data ?? []);
    setOrders(ordersResult.orders ?? []);
    setIsLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      queueMicrotask(() => {
        setProfile(null);
        setAddresses([]);
        setOrders([]);
        setIsLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      void refreshAccountData();
    });
  }, [authLoading, isAuthenticated, refreshAccountData, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const profileChannel = supabase
      .channel(`account-profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_profiles", filter: `user_id=eq.${user.id}` },
        () => void refreshAccountData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_addresses", filter: `user_id=eq.${user.id}` },
        () => void refreshAccountData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` },
        () => void refreshAccountData()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(profileChannel);
    };
  }, [refreshAccountData, supabase, user]);

  const value = useMemo(
    () => ({
      profile,
      addresses,
      orders,
      isLoading,
      refreshAccountData,
    }),
    [addresses, isLoading, orders, profile, refreshAccountData]
  );

  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>;
}

export function useAccountData() {
  const ctx = useContext(AccountDataContext);

  if (!ctx) {
    throw new Error("useAccountData must be used inside <AccountDataProvider>");
  }

  return ctx;
}
