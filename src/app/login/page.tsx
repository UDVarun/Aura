"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

// ── Social Auth button icons (inline SVG for no extra deps) ──────────────────
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function GitHubIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
    );
}

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { login, loginWithProvider, isAuthenticated, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";
    const required = searchParams.get("required");

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            const dashboardMap: Record<string, string> = {
                admin: "/admin",
                vendor: "/vendor",
                customer: "/",
            };
            router.push(redirect !== "/" ? redirect : (dashboardMap[user.role] ?? "/"));
        }
    }, [isAuthenticated, user, redirect, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error || "Login failed. Please try again.");
            setIsLoading(false);
            return;
        }

        setSuccess(true);
        // Router push handled by useEffect above after auth state updates
    };

    const handleOAuth = async (provider: "google" | "github") => {
        setOauthLoading(provider);
        setError("");
        const result = await loginWithProvider(provider);
        if (!result.success) {
            setError(result.error || `${provider} login failed.`);
            setOauthLoading(null);
        }
        // On success: browser redirects to OAuth provider automatically
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Left decorative panel */}
                <div className={styles.decorPanel}>
                    <div className={styles.decorContent}>
                        <div className={styles.decorLogo}>Aura</div>
                        <h2 className={styles.decorTitle}>Welcome back to the future of shopping</h2>
                        <p className={styles.decorText}>
                            Sign in to access your personalized dashboard, track orders, and discover new arrivals.
                        </p>
                        <div className={styles.decorFeatures}>
                            <div className={styles.decorFeature}>✓ Secure SSL encryption</div>
                            <div className={styles.decorFeature}>✓ Real-time order tracking</div>
                            <div className={styles.decorFeature}>✓ Premium member benefits</div>
                        </div>
                    </div>
                    <div className={styles.decorOrbs}>
                        <div className={styles.orb1} />
                        <div className={styles.orb2} />
                    </div>
                </div>

                {/* Form Panel */}
                <div className={styles.formPanel}>
                    <div className={styles.formContent}>
                        <h1 className={styles.title}>Sign in</h1>
                        <p className={styles.subtitle}>
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className={styles.link}>Create one free</Link>
                        </p>

                        {required && (
                            <div className={styles.alertBanner}>
                                <AlertCircle size={16} />
                                You need an <strong>{required}</strong> account to access that page.
                            </div>
                        )}

                        {/* Social Auth */}
                        <div className={styles.socialSection}>
                            <button
                                type="button"
                                className={`${styles.socialBtn} ${styles.googleBtn}`}
                                onClick={() => handleOAuth("google")}
                                disabled={!!oauthLoading || isLoading}
                            >
                                {oauthLoading === "google" ? (
                                    <span className={`animate-spin ${styles.spinner}`}>⟳</span>
                                ) : (
                                    <GoogleIcon />
                                )}
                                Continue with Google
                            </button>

                            <button
                                type="button"
                                className={`${styles.socialBtn} ${styles.githubBtn}`}
                                onClick={() => handleOAuth("github")}
                                disabled={!!oauthLoading || isLoading}
                            >
                                {oauthLoading === "github" ? (
                                    <span className={`animate-spin ${styles.spinner}`}>⟳</span>
                                ) : (
                                    <GitHubIcon />
                                )}
                                Continue with GitHub
                            </button>
                        </div>

                        <div className={styles.divider}>
                            <div className={styles.dividerLine} />
                            <span className={styles.dividerText}>or continue with email</span>
                            <div className={styles.dividerLine} />
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleSubmit} className={styles.form} noValidate>
                            <div className={styles.field}>
                                <label htmlFor="email" className={styles.label}>Email address</label>
                                <div className={styles.inputWrapper}>
                                    <Mail size={16} className={styles.inputIcon} />
                                    <input
                                        id="email"
                                        type="email"
                                        className={`input ${styles.input}`}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        required
                                        disabled={isLoading || success}
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <div className={styles.labelRow}>
                                    <label htmlFor="password" className={styles.label}>Password</label>
                                    <Link href="/forgot-password" className={styles.link}>Forgot password?</Link>
                                </div>
                                <div className={styles.inputWrapper}>
                                    <Lock size={16} className={styles.inputIcon} />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className={`input ${styles.input} ${styles.inputWithAction}`}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                        disabled={isLoading || success}
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className={styles.errorMessage} role="alert">
                                    <AlertCircle size={15} /> {error}
                                </div>
                            )}

                            {success && (
                                <div className={styles.successMessage} role="status">
                                    <CheckCircle size={15} /> Signed in! Redirecting...
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`btn btn-primary ${styles.submitBtn}`}
                                disabled={isLoading || success || !!oauthLoading}
                            >
                                {isLoading ? (
                                    <><span className={`animate-spin ${styles.spinner}`}>⟳</span> Signing in...</>
                                ) : "Sign In"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
