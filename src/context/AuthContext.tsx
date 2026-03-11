"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

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
        provider: OAuthProvider,
        role?: "customer" | "vendor",
        nextPath?: string
    ) => Promise<{ success: boolean; error?: string }>;
    register: (
        name: string,
        email: string,
        password: string,
        role?: "customer" | "vendor"
    ) => Promise<{ success: boolean; sessionCreated?: boolean; error?: string }>;
    resendConfirmation: (
        email: string
    ) => Promise<{ success: boolean; error?: string }>;
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

    const supabase = useMemo(() => createClient(), []);

    // Fetch the user's role from the user_roles table
    const fetchRole = useCallback(
        async (userId: string): Promise<UserRole> => {
            const { data } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();
            return (data?.role as UserRole) ?? "customer";
        },
        [supabase]
    );

    // Initialize and listen to auth state changes
    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            try {
                const { data: { session: initSession } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (initSession) {
                    console.log("[AUTH] Initial session recovered:", initSession.user.email);
                    const cookies = document.cookie.split(";");
                    const roleCookie = cookies.find((c) => c.trim().startsWith("role="));
                    const role = (roleCookie?.split("=")[1] as UserRole) || "customer";
                    
                    setSession(initSession);
                    setUser(buildAuthUser(initSession.user, role));
                    
                    // Update role from DB in background
                    fetchRole(initSession.user.id).then(actualRole => {
                        if (mounted && actualRole !== role) {
                            setUser(prev => prev ? buildAuthUser(initSession.user, actualRole) : null);
                            document.cookie = `role=${actualRole}; path=/; max-age=31536000; SameSite=Lax`;
                        }
                    });
                } else {
                    console.log("[AUTH] No initial session found.");
                }
            } catch (err) {
                console.error("[AUTH] Error in getSession:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`[AUTH] Auth event: ${event}`);
            
            if (newSession) {
                setSession(newSession);
                // Try reading role cookie for immediate UI sync
                const cookies = document.cookie.split(";");
                const roleCookie = cookies.find((c) => c.trim().startsWith("role="));
                const role = (roleCookie?.split("=")[1] as UserRole) || "customer";
                
                setUser(buildAuthUser(newSession.user, role));

                // Fetch true role
                const actualRole = await fetchRole(newSession.user.id);
                if (mounted && actualRole !== role) {
                    setUser(buildAuthUser(newSession.user, actualRole));
                    document.cookie = `role=${actualRole}; path=/; max-age=31536000; SameSite=Lax`;
                }
            } else {
                setSession(null);
                setUser(null);
                if (event === "SIGNED_OUT") {
                    document.cookie = "role=; path=/; max-age=0; SameSite=Lax";
                }
            }
            if (mounted) setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
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
            provider: OAuthProvider,
            role?: "customer" | "vendor",
            nextPath?: string
        ): Promise<{ success: boolean; error?: string }> => {
            const redirectUrl = new URL(`${window.location.origin}/auth/callback`);
            if (role) redirectUrl.searchParams.set("role", role);
            if (nextPath) redirectUrl.searchParams.set("next", nextPath);

            console.log(`[AUTH] Initiating OAuth for ${provider}, redirecting to: ${redirectUrl.toString()}`);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectUrl.toString(),
                    queryParams: {
                        ...(provider === "google" && { prompt: "select_account" }),
                    },
                },
            });
            if (error) {
                console.error(`[AUTH] OAuth error (${provider}):`, error.message);
                return { success: false, error: error.message };
            }

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
            password: string,
            role: "customer" | "vendor" = "customer"
        ): Promise<{ success: boolean; sessionCreated?: boolean; error?: string }> => {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: { 
                        full_name: name,
                        role: role // Pass role to trigger
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                console.error("[AUTH] Registration error:", error.message);
                return { success: false, error: error.message };
            }

            if (data?.user?.id) {
                const finalRole = role === "vendor" ? "vendor" : "customer";
                console.log(`[AUTH] User created (${data.user.id}). Attempting client-side profile upsert for role: ${finalRole}`);
                
                try {
                    const { error: upsertError } = await supabase.from("profiles").upsert({
                        id: data.user.id,
                        email: data.user.email ?? email.trim().toLowerCase(),
                        role: finalRole,
                    });
                    if (upsertError) console.warn("[AUTH] Client-side profile upsert skipped:", upsertError.message);
                } catch (e) {
                    console.warn("[AUTH] Client-side profile upsert ignored.");
                }
            }

            return { success: true, sessionCreated: !!data.session };
        },
        [supabase]
    );

    const resendConfirmation = useCallback(
        async (email: string): Promise<{ success: boolean; error?: string }> => {
            const normalizedEmail = email.trim().toLowerCase();
            const { error } = await supabase.auth.resend({
                type: "signup",
                email: normalizedEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) return { success: false, error: error.message };
            return { success: true };
        },
        [supabase]
    );

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        document.cookie = "role=; path=/; max-age=0; SameSite=Lax";
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
                resendConfirmation,
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
