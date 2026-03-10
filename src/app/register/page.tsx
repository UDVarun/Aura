"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle, Briefcase, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

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

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "customer" as "customer" | "vendor",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [autoLoggedIn, setAutoLoggedIn] = useState(false);
    const [info, setInfo] = useState("");

    const { register, loginWithProvider, resendConfirmation } = useAuth();
    const router = useRouter();

    const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setInfo("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setIsLoading(true);
        const result = await register(form.name, form.email, form.password, form.role);

        if (!result.success) {
            setError(result.error || "Registration failed. Please try again.");
            setIsLoading(false);
            return;
        }

        setSuccess(true);
        if (result.sessionCreated) {
            // Email confirmation is OFF → user is already logged in, go straight to home or specialized onboarding
            setAutoLoggedIn(true);
            setTimeout(() => {
                if (form.role === "vendor") {
                    router.push("/become-vendor");
                } else {
                    router.push("/");
                }
            }, 800);
        }
        // If email confirmation is ON: user stays on page seeing the "check email" message
    };

    const handleResendConfirmation = async () => {
        setError("");
        setInfo("");
        setIsLoading(true);

        const result = await resendConfirmation(form.email);
        if (!result.success) {
            setError(result.error || "Unable to resend confirmation email.");
            setIsLoading(false);
            return;
        }

        setInfo("Confirmation email sent again. Check inbox, spam, and promotions.");
        setIsLoading(false);
    };

    const handleOAuth = async (provider: "google" | "github") => {
        setOauthLoading(provider);
        setError("");
        const result = await loginWithProvider(provider, form.role);
        if (!result.success) {
            setError(result.error || `${provider} sign-up failed.`);
            setOauthLoading(null);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.formPanel}>
                <div className={styles.formContent}>
                    <div className={styles.logo}>Aura</div>
                    <h1 className={styles.title}>Create your account</h1>
                    <p className={styles.subtitle}>
                        Already have an account?{" "}
                        <Link href="/login" className={styles.link}>Sign in</Link>
                    </p>

                    {/* Social Auth */}
                    <div className={styles.socialSection}>
                        <button
                            type="button"
                            className={`${styles.socialBtn} ${styles.googleBtn}`}
                            onClick={() => handleOAuth("google")}
                            disabled={!!oauthLoading || isLoading}
                        >
                            {oauthLoading === "google" ? <span className={styles.spinner}>⟳</span> : <GoogleIcon />}
                            Sign up with Google
                        </button>

                        <button
                            type="button"
                            className={`${styles.socialBtn} ${styles.githubBtn}`}
                            onClick={() => handleOAuth("github")}
                            disabled={!!oauthLoading || isLoading}
                        >
                            {oauthLoading === "github" ? <span className={styles.spinner}>⟳</span> : <GitHubIcon />}
                            Sign up with GitHub
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <div className={styles.dividerLine} />
                        <span className={styles.dividerText}>or create with email</span>
                        <div className={styles.dividerLine} />
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        <div className={styles.roleTabs}>
                            <button
                                type="button"
                                className={`${styles.roleTab} ${form.role === "customer" ? styles.roleTabActive : ""}`}
                                onClick={() => setForm(f => ({ ...f, role: "customer" }))}
                            >
                                <UserIcon size={16} />
                                <span>Personal Account</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.roleTab} ${form.role === "vendor" ? styles.roleTabActive : ""}`}
                                onClick={() => setForm(f => ({ ...f, role: "vendor" }))}
                            >
                                <Briefcase size={16} />
                                <span>Business Account</span>
                            </button>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="name" className={styles.label}>Full Name</label>
                            <div className={styles.inputWrapper}>
                                <User size={16} className={styles.inputIcon} />
                                <input
                                    id="name"
                                    type="text"
                                    className={`input ${styles.input}`}
                                    value={form.name}
                                    onChange={set("name")}
                                    placeholder="Your full name"
                                    autoComplete="name"
                                    required
                                    disabled={isLoading || success}
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="email" className={styles.label}>Email address</label>
                            <div className={styles.inputWrapper}>
                                <Mail size={16} className={styles.inputIcon} />
                                <input
                                    id="email"
                                    type="email"
                                    className={`input ${styles.input}`}
                                    value={form.email}
                                    onChange={set("email")}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                    disabled={isLoading || success}
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <div className={styles.inputWrapper}>
                                <Lock size={16} className={styles.inputIcon} />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className={`input ${styles.input} ${styles.inputWithAction}`}
                                    value={form.password}
                                    onChange={set("password")}
                                    placeholder="Min. 8 characters"
                                    autoComplete="new-password"
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
                            <div className={styles.passwordStrength}>
                                <div className={`${styles.strengthBar} ${form.password.length >= 8 ? styles.strengthGood : form.password.length >= 4 ? styles.strengthMid : form.password.length > 0 ? styles.strengthWeak : ""}`} />
                                {form.password.length > 0 && (
                                    <span className={styles.strengthLabel}>
                                        {form.password.length >= 12 ? "Strong" : form.password.length >= 8 ? "Good" : "Too short"}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                            <div className={styles.inputWrapper}>
                                <Lock size={16} className={styles.inputIcon} />
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    className={`input ${styles.input} ${form.confirmPassword && form.password !== form.confirmPassword ? styles.inputError : ""}`}
                                    value={form.confirmPassword}
                                    onChange={set("confirmPassword")}
                                    placeholder="Repeat password"
                                    autoComplete="new-password"
                                    required
                                    disabled={isLoading || success}
                                />
                                {form.confirmPassword && form.password === form.confirmPassword && (
                                    <CheckCircle size={16} className={styles.inputCheck} />
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className={styles.errorMessage} role="alert">
                                <AlertCircle size={15} />
                                {error.includes("rate limit") ? (
                                    <span>
                                        <strong>Email rate limit exceeded.</strong> This is a Supabase security measure.
                                        <br />
                                        <Link href="https://supabase.com/dashboard/project/_/auth/providers" target="_blank" className={styles.errorLink}>
                                            Turn off &quot;Confirm email&quot; in your Supabase Dashboard
                                        </Link> to bypass this for testing.
                                    </span>
                                ) : error}
                            </div>
                        )}

                        {success && (
                            <div className={styles.successMessage} role="status">
                                <CheckCircle size={15} />
                                {autoLoggedIn
                                    ? " Account created! Taking you home..."
                                    : " Account created! Check your email to confirm, then sign in."}
                            </div>
                        )}

                        {success && !autoLoggedIn && (
                            <button
                                type="button"
                                className={`btn btn-secondary ${styles.submitBtn}`}
                                onClick={handleResendConfirmation}
                                disabled={isLoading || !!oauthLoading}
                            >
                                Resend Confirmation Email
                            </button>
                        )}

                        {info && (
                            <div className={styles.successMessage} role="status">
                                <CheckCircle size={15} />
                                {info}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`btn btn-primary ${styles.submitBtn}`}
                            disabled={isLoading || success || !!oauthLoading}
                        >
                            {isLoading ? "Creating account..." : "Create Account"}
                        </button>

                        <p className={styles.terms}>
                            By creating an account, you agree to our{" "}
                            <Link href="/terms" className={styles.link}>Terms of Service</Link> and{" "}
                            <Link href="/privacy" className={styles.link}>Privacy Policy</Link>.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
