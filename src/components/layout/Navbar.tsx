"use client";

import Image from "next/image";
import Link from "next/link";
import {
    ChevronDown,
    CircleUserRound,
    Clock3,
    Layers3,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Search,
    Settings,
    ShoppingCart,
    Star,
    Store,
    Sun,
    Tag,
    User,
    X,
} from "lucide-react";
import styles from "./Navbar.module.css";
import { useEffect, useRef, useState, startTransition } from "react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/currency";
import {
    MAX_RECENT_SEARCHES,
    MIN_SUGGESTION_QUERY_LENGTH,
    escapeRegExp,
    sanitizeSearchQuery,
    type SearchBrandSuggestion,
    type SearchCategorySuggestion,
    type SearchProductSuggestion,
    type SearchSuggestionResponse,
} from "@/lib/search";
import {
    clearRecentSearchesStorage,
    loadSearchUserProfile,
    persistPurchasedTerms,
    removeRecentSearch,
    saveRecentSearches,
} from "@/lib/search-personalization";

const CUSTOMER_NAV = [
    { href: "/", label: "Home" },
    { href: "/products", label: "All" },
    { href: "/offers", label: "Offers" },
    { href: "/about", label: "About" },
    { href: "/customer-care", label: "Customer Care" },
];

type SearchSurface = "desktop" | "mobile";

type SearchActionItem =
    | {
        id: string;
        kind: "recent" | "keyword";
        label: string;
        meta?: string;
        onSelect: () => void;
    }
    | {
        id: string;
        kind: "category";
        label: string;
        meta?: string;
        onSelect: () => void;
        category: SearchCategorySuggestion;
    }
    | {
        id: string;
        kind: "brand";
        label: string;
        meta?: string;
        onSelect: () => void;
        brand: SearchBrandSuggestion;
    }
    | {
        id: string;
        kind: "product";
        label: string;
        meta?: string;
        onSelect: () => void;
        product: SearchProductSuggestion;
    };

function highlightMatch(text: string, query: string) {
    const normalizedQuery = sanitizeSearchQuery(query);
    if (!normalizedQuery) {
        return text;
    }

    const regex = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig");
    return text.split(regex).map((part, index) => (
        part.toLowerCase() === normalizedQuery.toLowerCase()
            ? <mark key={`${part}-${index}`} className={styles.highlight}>{part}</mark>
            : <span key={`${part}-${index}`}>{part}</span>
    ));
}

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchData, setSearchData] = useState<SearchSuggestionResponse | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [activeSearchSurface, setActiveSearchSurface] = useState<SearchSurface | null>(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [viewedProducts, setViewedProducts] = useState<string[]>([]);
    const [viewedCategories, setViewedCategories] = useState<string[]>([]);
    const [purchasedTerms, setPurchasedTerms] = useState<string[]>([]);
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, setTheme } = useTheme();
    const { itemCount, openCart } = useCart();
    const router = useRouter();
    const pathname = usePathname();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const desktopSearchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);
    const searchCacheRef = useRef<Map<string, SearchSuggestionResponse>>(new Map());

    useEffect(() => {
        const query = new URLSearchParams(window.location.search).get("q");
        setSearchQuery(query ?? "");
    }, [pathname]);

    useEffect(() => {
        const profile = loadSearchUserProfile(user?.id);
        setRecentSearches(profile.recentSearches);
        setViewedProducts(profile.viewedProducts);
        setViewedCategories(profile.viewedCategories);
        setPurchasedTerms(profile.purchasedTerms);
    }, [user?.id]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let cancelled = false;

        const loadPurchasedTerms = async () => {
            try {
                const response = await fetch("/api/orders/me", { headers: { Accept: "application/json" } });
                if (!response.ok) {
                    return;
                }

                const payload = await response.json() as { orders?: { order_items?: { product_title?: string | null }[] | null }[] };
                const terms = (payload.orders ?? [])
                    .flatMap((order) => order.order_items ?? [])
                    .map((item) => item.product_title ?? "")
                    .filter(Boolean);

                if (!cancelled && terms.length > 0) {
                    persistPurchasedTerms(terms, user?.id);
                    setPurchasedTerms(terms.map((term) => sanitizeSearchQuery(term)).filter(Boolean));
                }
            } catch {
                return;
            }
        };

        void loadPurchasedTerms();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;

            if (userMenuRef.current && !userMenuRef.current.contains(target)) {
                setUserMenuOpen(false);
                setSettingsOpen(false);
            }

            const insideDesktopSearch = desktopSearchRef.current?.contains(target) ?? false;
            const insideMobileSearch = mobileSearchRef.current?.contains(target) ?? false;

            if (!insideDesktopSearch && !insideMobileSearch) {
                setIsSearchOpen(false);
                setActiveSuggestionIndex(-1);
                setActiveSearchSurface(null);
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    useEffect(() => {
        if (!mobileOpen && activeSearchSurface === "mobile") {
            setIsSearchOpen(false);
            setActiveSuggestionIndex(-1);
            setActiveSearchSurface(null);
        }
    }, [activeSearchSurface, mobileOpen]);

    useEffect(() => {
        if (!isSearchOpen) {
            setActiveSuggestionIndex(-1);
            return;
        }

        const normalizedQuery = sanitizeSearchQuery(searchQuery);
        if (!normalizedQuery) {
            setSearchData({
                query: "",
                completion: null,
                products: [],
                categories: [],
                brands: [],
                keywords: [],
                trending: [],
            });
            setIsSearching(false);
            return;
        }

        const cacheKey = normalizedQuery ? `query:${normalizedQuery.toLowerCase()}` : "trending";
        const cached = searchCacheRef.current.get(cacheKey);

        if (cached) {
            setSearchData(cached);
            setIsSearching(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setIsSearching(true);

            try {
                const endpoint = normalizedQuery
                    ? `/api/search/suggestions?q=${encodeURIComponent(normalizedQuery)}`
                    : "/api/search/suggestions";
                const response = await fetch(endpoint, {
                    signal: controller.signal,
                    headers: { Accept: "application/json" },
                });

                if (!response.ok) {
                    throw new Error(`Search request failed with ${response.status}`);
                }

                const data = (await response.json()) as SearchSuggestionResponse;
                searchCacheRef.current.set(cacheKey, data);
                setSearchData(data);
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Failed to fetch search suggestions:", error);
                    setSearchData(null);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, normalizedQuery.length >= MIN_SUGGESTION_QUERY_LENGTH ? 180 : 0);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [isSearchOpen, searchQuery]);

    useEffect(() => {
        const input = activeSearchSurface === "mobile" ? mobileInputRef.current : desktopInputRef.current;
        const normalizedQuery = sanitizeSearchQuery(searchQuery);
        const completion = searchData?.completion;

        if (!input || document.activeElement !== input || !completion || normalizedQuery.length < MIN_SUGGESTION_QUERY_LENGTH) {
            return;
        }

        if (!completion.toLowerCase().startsWith(normalizedQuery.toLowerCase()) || completion.length <= normalizedQuery.length) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            input.setSelectionRange(normalizedQuery.length, completion.length);
        });

        return () => window.cancelAnimationFrame(frame);
    }, [activeSearchSurface, searchData, searchQuery]);

    const saveRecentSearch = (value: string) => {
        const normalized = sanitizeSearchQuery(value);
        if (!normalized) {
            return;
        }

        const nextRecent = [
            normalized,
            ...recentSearches.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
        ].slice(0, MAX_RECENT_SEARCHES);

        setRecentSearches(nextRecent);
        saveRecentSearches(nextRecent, user?.id);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        clearRecentSearchesStorage(user?.id);
    };

    const handleRemoveRecentSearch = (value: string) => {
        const nextValues = removeRecentSearch(value, user?.id);
        setRecentSearches(nextValues);
    };

    const closeSearch = (shouldBlur = false) => {
        const input = activeSearchSurface === "mobile" ? mobileInputRef.current : desktopInputRef.current;
        setIsSearchOpen(false);
        setActiveSuggestionIndex(-1);

        if (shouldBlur) {
            input?.blur();
            setActiveSearchSurface(null);
        }
    };

    const resetSearch = ({ blur = false, navigateToAllProducts = false }: { blur?: boolean; navigateToAllProducts?: boolean } = {}) => {
        setSearchQuery("");
        setSearchData(null);
        setIsSearching(false);
        closeSearch(blur);

        if (navigateToAllProducts && pathname.startsWith("/products")) {
            startTransition(() => {
                router.push("/products");
            });
        }

        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("aura:search-reset"));
        }
    };

    const navigateTo = (href: string, recentValue?: string) => {
        if (recentValue) {
            saveRecentSearch(recentValue);
        }

        setSearchQuery(recentValue ?? searchQuery);
        setIsSearchOpen(false);
        setActiveSuggestionIndex(-1);

        startTransition(() => {
            router.push(href);
        });
    };

    const submitSearch = (value: string) => {
        const normalized = sanitizeSearchQuery(value);
        if (!normalized) {
            if (pathname === "/products") {
                startTransition(() => {
                    router.push("/products");
                });
            }
            closeSearch(true);
            return;
        }

        navigateTo(`/products?q=${encodeURIComponent(normalized)}`, normalized);
    };

    const acceptCompletion = () => {
        const normalizedQuery = sanitizeSearchQuery(searchQuery);
        const completion = searchData?.completion;

        if (
            !completion ||
            normalizedQuery.length < MIN_SUGGESTION_QUERY_LENGTH ||
            !completion.toLowerCase().startsWith(normalizedQuery.toLowerCase()) ||
            completion.length <= normalizedQuery.length
        ) {
            return false;
        }

        setSearchQuery(completion);
        return true;
    };

    const handleSearchFocus = (surface: SearchSurface) => {
        setActiveSearchSurface(surface);
        setIsSearchOpen(true);
    };

    const handleInputChange = (value: string) => {
        setSearchQuery(sanitizeSearchQuery(value));
        setActiveSuggestionIndex(-1);
        if (!isSearchOpen) {
            setIsSearchOpen(true);
        }
    };

    const getPersonalizationScore = (value: string, type: "product" | "category" | "keyword" | "brand") => {
        const normalized = sanitizeSearchQuery(value).toLowerCase();
        if (!normalized) {
            return 0;
        }

        let score = 0;
        if (recentSearches.some((item) => item.toLowerCase() === normalized)) score += 10;
        if (viewedProducts.some((item) => item.toLowerCase() === normalized)) score += type === "product" ? 9 : 2;
        if (viewedCategories.some((item) => item.toLowerCase() === normalized)) score += type === "category" ? 8 : 2;
        if (purchasedTerms.some((item) => item.toLowerCase() === normalized)) score += type === "product" || type === "keyword" ? 7 : 1;
        if (viewedCategories.some((item) => normalized.includes(item.toLowerCase()))) score += 2;
        if (viewedProducts.some((item) => normalized.includes(item.toLowerCase()))) score += 2;
        return score;
    };

    const buildSuggestionItems = () => {
        const items: SearchActionItem[] = [];
        const normalizedQuery = sanitizeSearchQuery(searchQuery);
        const queryIsActive = normalizedQuery.length >= MIN_SUGGESTION_QUERY_LENGTH;

        if (!queryIsActive) {
            for (const term of recentSearches) {
                items.push({
                    id: `recent:${term.toLowerCase()}`,
                    kind: "recent",
                    label: term,
                    meta: "Recent search",
                    onSelect: () => submitSearch(term),
                });
            }
        } else {
            const personalizedKeywords = [...(searchData?.keywords ?? [])].sort(
                (left, right) => getPersonalizationScore(right.term, "keyword") - getPersonalizationScore(left.term, "keyword"),
            );
            const personalizedCategories = [...(searchData?.categories ?? [])].sort(
                (left, right) => getPersonalizationScore(right.name, "category") - getPersonalizationScore(left.name, "category"),
            );
            const personalizedBrands = [...(searchData?.brands ?? [])].sort(
                (left, right) => getPersonalizationScore(right.name, "brand") - getPersonalizationScore(left.name, "brand"),
            );
            const personalizedProducts = [...(searchData?.products ?? [])].sort(
                (left, right) => getPersonalizationScore(right.title, "product") - getPersonalizationScore(left.title, "product"),
            );

            for (const keyword of personalizedKeywords) {
                items.push({
                    id: keyword.id,
                    kind: "keyword",
                    label: keyword.term,
                    meta: "Suggested keyword",
                    onSelect: () => submitSearch(keyword.term),
                });
            }

            for (const category of personalizedCategories) {
                items.push({
                    id: category.id,
                    kind: "category",
                    label: category.name,
                    meta: "Category",
                    category,
                    onSelect: () => {
                        if (category.slug) {
                            navigateTo(`/products?category=${encodeURIComponent(category.slug)}`, category.name);
                        } else {
                            submitSearch(category.name);
                        }
                    },
                });
            }

            for (const brand of personalizedBrands) {
                items.push({
                    id: brand.id,
                    kind: "brand",
                    label: brand.name,
                    meta: "Brand",
                    brand,
                    onSelect: () => submitSearch(brand.name),
                });
            }

            for (const product of personalizedProducts) {
                items.push({
                    id: product.id,
                    kind: "product",
                    label: product.title,
                    meta: product.brand ?? "Product",
                    product,
                    onSelect: () => navigateTo(`/products/${product.id}`, product.title),
                });
            }
        }

        return { items, queryIsActive };
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (activeSuggestionIndex >= 0) {
            const selectedItem = buildSuggestionItems().items[activeSuggestionIndex];
            selectedItem?.onSelect();
            return;
        }

        submitSearch(searchQuery);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const items = buildSuggestionItems().items;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!isSearchOpen) {
                setIsSearchOpen(true);
                return;
            }

            if (items.length > 0) {
                setActiveSuggestionIndex((prev) => (prev + 1) % items.length);
            }
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (items.length > 0) {
                setActiveSuggestionIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
            }
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            resetSearch({ blur: true, navigateToAllProducts: true });
            return;
        }

        if (event.key === "Tab" && acceptCompletion()) {
            event.preventDefault();
            return;
        }

        if (event.key === "ArrowRight") {
            const input = event.currentTarget;
            const selectionStartsAtQuery = input.selectionStart === sanitizeSearchQuery(searchQuery).length;
            const selectionEndsAtCompletion = input.selectionEnd === input.value.length;
            if (selectionStartsAtQuery && selectionEndsAtCompletion && acceptCompletion()) {
                event.preventDefault();
            }
        }
    };

    const clearOrCloseSearch = () => {
        resetSearch({ blur: false, navigateToAllProducts: true });
    };

    const renderSearchRow = (item: SearchActionItem, index: number, query: string) => {
        const isActive = index === activeSuggestionIndex;

        if (item.kind === "product") {
            return (
                <button
                    key={item.id}
                    type="button"
                    className={clsx(styles.productSuggestion, { [styles.productSuggestionActive]: isActive })}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={item.onSelect}
                >
                    <div className={styles.suggestionThumb}>
                        <Image
                            src={item.product.imageUrl || "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=400&auto=format&fit=crop"}
                            alt={item.product.title}
                            fill
                            sizes="44px"
                        />
                    </div>
                    <div className={styles.suggestionInfo}>
                        <div className={styles.suggestionName}>{highlightMatch(item.product.title, query)}</div>
                        <div className={styles.suggestionMetaRow}>
                            {item.product.categoryName && <span className={styles.suggestionPill}>{item.product.categoryName}</span>}
                            {item.product.brand && <span className={styles.suggestionBrand}>{highlightMatch(item.product.brand, query)}</span>}
                        </div>
                        <div className={styles.productPreviewMeta}>
                            <span>{formatCurrency(item.product.price)}</span>
                            <span className={styles.previewDivider} />
                            <span className={styles.previewRating}><Star size={12} fill="currentColor" /> {item.product.rating.toFixed(1)}</span>
                            <span className={styles.previewDivider} />
                            <span>{item.product.sellerLabel}</span>
                        </div>
                    </div>
                    <div className={styles.suggestionPrice}>{formatCurrency(item.product.price)}</div>
                </button>
            );
        }

        const icon = item.kind === "recent"
            ? <Clock3 size={15} />
            : item.kind === "category"
                ? <Layers3 size={15} />
                : item.kind === "brand"
                    ? <Store size={15} />
                    : <Tag size={15} />;

        return (
            <div
                key={item.id}
                className={clsx(styles.simpleSuggestionShell, { [styles.simpleSuggestionActive]: isActive })}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
            >
                <button
                    type="button"
                    className={styles.simpleSuggestion}
                    onClick={item.onSelect}
                >
                    <span className={styles.simpleSuggestionIcon}>{icon}</span>
                    <span className={styles.simpleSuggestionText}>
                        <span className={styles.simpleSuggestionLabel}>{highlightMatch(item.label, query)}</span>
                        {item.meta && <span className={styles.simpleSuggestionMeta}>{item.meta}</span>}
                    </span>
                </button>
                {item.kind === "recent" && (
                    <button
                        type="button"
                        className={styles.removeRecentButton}
                        aria-label={`Remove ${item.label} from recent searches`}
                        onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveRecentSearch(item.label);
                        }}
                    >
                        <X size={13} />
                    </button>
                )}
            </div>
        );
    };

    const renderSearchDropdown = (surface: SearchSurface) => {
        const { items, queryIsActive } = buildSuggestionItems();
        const normalizedQuery = sanitizeSearchQuery(searchQuery);
        const hasDiscovery = recentSearches.length > 0;
        const shouldShow = isSearchOpen && activeSearchSurface === surface && (queryIsActive || hasDiscovery || isSearching);

        if (!shouldShow) {
            return null;
        }

        let currentIndex = 0;
        const recentItems = items.filter((item) => item.kind === "recent");
        const keywordItems = items.filter((item) => item.kind === "keyword");
        const categoryItems = items.filter((item) => item.kind === "category");
        const brandItems = items.filter((item) => item.kind === "brand");
        const productItems = items.filter((item) => item.kind === "product");

        const renderSection = (title: string, sectionItems: SearchActionItem[], action?: React.ReactNode) => {
            if (sectionItems.length === 0) {
                return null;
            }

            const content = sectionItems.map((item) => {
                const row = renderSearchRow(item, currentIndex, normalizedQuery);
                currentIndex += 1;
                return row;
            });

            return (
                <div className={styles.suggestionSection}>
                    <div className={styles.suggestionSectionHeader}>
                        <h4 className={styles.suggestionTitle}>{title}</h4>
                        {action}
                    </div>
                    <div className={styles.suggestionSectionBody}>{content}</div>
                </div>
            );
        };

        return (
            <div className={clsx(styles.suggestionsDropdown, surface === "mobile" && styles.mobileSuggestionsDropdown)}>
                {!queryIsActive && (
                    <>
                        {renderSection(
                            "Recent Searches",
                            recentItems,
                            recentItems.length > 0 ? (
                                <button type="button" className={styles.inlineAction} onClick={clearRecentSearches}>
                                    Clear
                                </button>
                            ) : null,
                        )}
                    </>
                )}

                {queryIsActive && (
                    <>
                        {renderSection("Suggested Keywords", keywordItems)}
                        {renderSection("Categories", categoryItems)}
                        {renderSection("Brands", brandItems)}
                        {renderSection("Products", productItems)}
                    </>
                )}

                {!isSearching && items.length === 0 && (
                    <div className={styles.noResults}>
                        {queryIsActive ? "No matches found. Try a broader product, brand, or category term." : "Start typing to explore products, brands, and categories."}
                    </div>
                )}
            </div>
        );
    };

    const displayedSearchValue = (() => {
        const normalizedQuery = sanitizeSearchQuery(searchQuery);
        const completion = searchData?.completion;

        if (
            isSearchOpen &&
            completion &&
            normalizedQuery.length >= MIN_SUGGESTION_QUERY_LENGTH &&
            completion.toLowerCase().startsWith(normalizedQuery.toLowerCase()) &&
            completion.length > normalizedQuery.length
        ) {
            return completion;
        }

        return searchQuery;
    })();

    const handleLogout = async () => {
        setUserMenuOpen(false);
        setSettingsOpen(false);
        setMobileOpen(false);
        await logout();
        router.push("/");
        router.refresh();
    };

    const getDashboardLink = () => {
        if (user?.role === "admin") return { href: "/admin", label: "Admin Panel", Icon: LayoutDashboard };
        if (user?.role === "vendor") return { href: "/vendor", label: "Vendor Hub", Icon: Store };
        return null;
    };

    const dashboardLink = getDashboardLink();
    const isNavActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

    return (
        <>
            <header className={clsx(styles.header, { [styles.scrolled]: scrolled })}>
                <div className={styles.navContainer}>
                    <div className={styles.logoContainer}>
                        <button
                            className={styles.mobileMenu}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen((value) => !value)}
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <Link href="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
                            Aura
                        </Link>
                    </div>

                    <nav className={styles.desktopNav} aria-label="Main navigation">
                        {CUSTOMER_NAV.map(({ href, label }) => (
                            <Link key={label} href={href} className={clsx(styles.navLink, { [styles.navLinkActive]: isNavActive(href) })}>
                                {label}
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.searchWrapper} ref={desktopSearchRef}>
                        <form className={styles.globalSearch} onSubmit={handleSearchSubmit}>
                            <div className={styles.searchBox}>
                                <input
                                    ref={desktopInputRef}
                                    type="text"
                                    placeholder="Search products, brands and more..."
                                    className={styles.searchInput}
                                    value={displayedSearchValue}
                                    onChange={(event) => handleInputChange(event.target.value)}
                                    onFocus={() => handleSearchFocus("desktop")}
                                    onKeyDown={handleInputKeyDown}
                                    autoComplete="off"
                                    spellCheck={false}
                                    aria-label="Search products, brands and more"
                                />
                                {(searchQuery || isSearchOpen) && (
                                    <button
                                        type="button"
                                        className={styles.clearSearchButton}
                                        aria-label={searchQuery ? "Clear search text" : "Exit search"}
                                        onClick={clearOrCloseSearch}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                {isSearching && <div className={styles.searchLoader} />}
                                <Search size={16} className={styles.searchIcon} />
                            </div>
                        </form>

                        {renderSearchDropdown("desktop")}
                    </div>

                    <div className={styles.actions}>
                        <div className={styles.userMenuWrapper} ref={userMenuRef}>
                            <button
                                className={styles.iconButton}
                                aria-label="User account"
                                aria-expanded={userMenuOpen}
                                onClick={() => setUserMenuOpen((value) => !value)}
                            >
                                <User size={20} />
                            </button>

                            {userMenuOpen && (
                                <div className={clsx(styles.userMenu, "animate-slide-down")}>
                                    {isAuthenticated && user ? (
                                        <>
                                            <div className={styles.userInfo}>
                                                <span className={styles.userName}>{user.name}</span>
                                                <span className={styles.userRole}>{user.role}</span>
                                            </div>
                                            <div className={styles.userMenuDivider} />
                                            {dashboardLink && (
                                                <Link href={dashboardLink.href} className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                                                    <dashboardLink.Icon size={18} strokeWidth={2} />
                                                    <span>{dashboardLink.label}</span>
                                                </Link>
                                            )}
                                            <Link href="/account" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                                                <User size={18} strokeWidth={2} />
                                                <span>Profile</span>
                                            </Link>
                                            <button
                                                type="button"
                                                className={clsx(styles.userMenuItem, styles.settingsTrigger)}
                                                onClick={() => setSettingsOpen((value) => !value)}
                                                aria-expanded={settingsOpen}
                                                aria-controls="theme-settings"
                                            >
                                                <span className={styles.settingsLabel}>
                                                    <Settings size={18} strokeWidth={2} />
                                                    <span>Settings</span>
                                                </span>
                                                <ChevronDown size={14} className={clsx(styles.settingsChevron, { [styles.settingsChevronOpen]: settingsOpen })} />
                                            </button>
                                            {settingsOpen && (
                                                <div className={styles.themeSwitchRow} id="theme-settings">
                                                    <button
                                                        type="button"
                                                        className={theme === "light" ? `${styles.themeChip} ${styles.themeChipActive}` : styles.themeChip}
                                                        onClick={() => setTheme("light")}
                                                    >
                                                        <Sun size={14} />
                                                        Light
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={theme === "dark" ? `${styles.themeChip} ${styles.themeChipActive}` : styles.themeChip}
                                                        onClick={() => setTheme("dark")}
                                                    >
                                                        <Moon size={14} />
                                                        Dark
                                                    </button>
                                                </div>
                                            )}
                                            <div className={styles.userMenuDivider} />
                                            <button className={clsx(styles.userMenuItem, styles.logoutItem)} onClick={handleLogout}>
                                                <LogOut size={18} strokeWidth={2} />
                                                <span>Sign Out</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href="/login" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>Sign In</Link>
                                            <Link href="/register" className={clsx(styles.userMenuItem, styles.registerItem)} onClick={() => setUserMenuOpen(false)}>Create Account</Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>



                        <button className={styles.cartButton} aria-label="Shopping cart" onClick={openCart}>
                            <ShoppingCart size={20} />
                            <span className={styles.cartBadge} aria-label={`${itemCount} items in cart`}>{itemCount}</span>
                        </button>
                    </div>
                </div>
            </header>

            {mobileOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />
            )}

            <nav
                className={clsx(styles.mobileNav, { [styles.mobileNavOpen]: mobileOpen })}
                aria-label="Mobile navigation"
                aria-hidden={!mobileOpen}
            >
                <div className={styles.mobileNavContent}>
                    <div className={styles.mobileSearchShell} ref={mobileSearchRef}>
                        <form className={styles.mobileSearch} onSubmit={handleSearchSubmit}>
                            <input
                                ref={mobileInputRef}
                                type="text"
                                placeholder="Search..."
                                className={styles.mobileSearchInput}
                                value={displayedSearchValue}
                                onChange={(event) => handleInputChange(event.target.value)}
                                onFocus={() => handleSearchFocus("mobile")}
                                onKeyDown={handleInputKeyDown}
                                autoComplete="off"
                                spellCheck={false}
                                aria-label="Search products"
                            />
                            {(searchQuery || isSearchOpen) && (
                                <button
                                    type="button"
                                    className={styles.mobileClearSearchButton}
                                    aria-label={searchQuery ? "Clear search text" : "Exit search"}
                                    onClick={clearOrCloseSearch}
                                >
                                    <X size={14} />
                                </button>
                            )}
                            {isSearching && <div className={styles.mobileSearchLoader} />}
                            <Search size={16} className={styles.searchIcon} />
                        </form>
                        {renderSearchDropdown("mobile")}
                    </div>
                    <div className={styles.mobileNavDivider} />

                    {CUSTOMER_NAV.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(styles.mobileNavLink, { [styles.mobileNavLinkActive]: isNavActive(href) })}
                            onClick={() => setMobileOpen(false)}
                        >
                            {label}
                        </Link>
                    ))}
                    <div className={styles.mobileNavDivider} />
                    {isAuthenticated && user ? (
                        <>
                            <Link href="/account" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
                                <CircleUserRound size={16} />
                                Profile
                            </Link>
                            <button className={clsx(styles.mobileNavLink, styles.mobileNavLogout)} onClick={handleLogout}>
                                <LogOut size={16} />
                                Sign Out ({user.name})
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>Sign In</Link>
                            <Link href="/register" className={clsx(styles.mobileNavLink, styles.mobileNavHighlight)} onClick={() => setMobileOpen(false)}>Create Account</Link>
                        </>
                    )}
                </div>
            </nav>
        </>
    );
}
