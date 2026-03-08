"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = "customer" | "admin" | "vendor";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export type OAuthProvider = "google" | "github" | "facebook" | "twitter";

interface AuthContextValue {
    user: AuthUser | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (
        email: string,
        password: string
    ) => Promise<{ success: boolean; error?: string }>;
    loginWithProvider: (
        provider: OAuthProvider
    ) => Promise<{ success: boolean; error?: string }>;
    register: (
        name: string,
        email: string,
        password: string
    ) => Promise<{ success: boolean; sessionCreated?: boolean; error?: string }>;
    logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// Helper to build AuthUser from Supabase User + role
function buildAuthUser(supabaseUser: User, role: UserRole): AuthUser {
    const meta = supabaseUser.user_metadata ?? {};
    return {
        id: supabaseUser.id,
        name:
            meta.full_name ??
            meta.name ??
            meta.user_name ??
            supabaseUser.email?.split("@")[0] ??
            "User",
        email: supabaseUser.email ?? "",
        role,
        avatar: meta.avatar_url ?? meta.picture ?? undefined,
    };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    // Fetch the user's role from the user_roles table
    const fetchRole = useCallback(
        async (userId: string): Promise<UserRole> => {
            const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("id", userId)
                .single();
            return (data?.role as UserRole) ?? "customer";
        },
        [supabase]
    );

    // Initialize and listen to auth state changes
    useEffect(() => {
        // Get the initial session
        const init = async () => {
            const {
                data: { session: initialSession },
            } = await supabase.auth.getSession();

            if (initialSession?.user) {
                const role = await fetchRole(initialSession.user.id);
                setUser(buildAuthUser(initialSession.user, role));
                setSession(initialSession);
                // Sync role cookie for middleware
                document.cookie = `role=${role}; path=/; SameSite=Strict`;
            }
            setIsLoading(false);
        };

        init();

        // Listen for auth events (login, logout, OAuth callback, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.user) {
                const role = await fetchRole(newSession.user.id);
                setUser(buildAuthUser(newSession.user, role));
                setSession(newSession);
                document.cookie = `role=${role}; path=/; SameSite=Strict`;
            } else {
                setUser(null);
                setSession(null);
                document.cookie = "role=; path=/; max-age=0; SameSite=Strict";
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase, fetchRole]);

    // ── Email / Password Login ───────────────────────────────────────────────
    const login = useCallback(
        async (
            email: string,
            password: string
        ): Promise<{ success: boolean; error?: string }> => {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        },
        [supabase]
    );

    // ── OAuth Social Login ───────────────────────────────────────────────────
    const loginWithProvider = useCallback(
        async (
            provider: OAuthProvider
        ): Promise<{ success: boolean; error?: string }> => {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        // Google-specific: always show account picker
                        ...(provider === "google" && { prompt: "select_account" }),
                    },
                },
            });
            if (error) return { success: false, error: error.message };
            // Browser will redirect to OAuth provider — no return value needed
            return { success: true };
        },
        [supabase]
    );

    // ── Register ─────────────────────────────────────────────────────────────
    const register = useCallback(
        async (
            name: string,
            email: string,
            password: string
        ): Promise<{ success: boolean; sessionCreated?: boolean; error?: string }> => {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: { full_name: name },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) return { success: false, error: error.message };
            // sessionCreated = true means email confirmation is OFF → user is already logged in
            return { success: true, sessionCreated: !!data.session };
        },
        [supabase]
    );

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        document.cookie = "role=; path=/; max-age=0; SameSite=Strict";
    }, [supabase]);

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isLoading,
                isAuthenticated: !!user,
                login,
                loginWithProvider,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
