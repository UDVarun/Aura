"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "aura-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getPreferredTheme(): Theme {
    if (typeof window === "undefined") return "dark";

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme());

    const setTheme = useCallback((nextTheme: Theme) => {
        setThemeState(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark");
    }, [theme, setTheme]);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme,
        }),
        [theme, setTheme, toggleTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
    return ctx;
}
