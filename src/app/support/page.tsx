"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Book, MessageCircle, FileText, ChevronRight, HelpCircle, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

const CATEGORIES = [
  { name: "Shipping", icon: Book, color: "blue" },
  { name: "Refunds", icon: FileText, color: "orange" },
  { name: "Communication", icon: MessageCircle, color: "green" },
  { name: "Security", icon: HelpCircle, color: "purple" },
];

export default function SupportHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/support/articles?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.articles || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <h1>How can we help you today?</h1>
            <p className={styles.heroSubtitle}>
              Search our knowledge base or browse by category to find answers to common questions.
            </p>
            
            <div className={styles.searchContainer}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} size={20} />
                <input
                  type="text"
                  placeholder="Search for articles, topics, or keywords..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <div className={styles.loader} />}
              </div>
              
              {searchResults.length > 0 && (
                <div className={styles.resultsDropdown}>
                  {searchResults.map((article: any) => (
                    <Link
                      key={article.id}
                      href={`/support/help-center/${article.slug}`}
                      className={styles.resultItem}
                    >
                      <div>
                        <span className={styles.resultTitle}>{article.title}</span>
                        <span className={styles.resultMeta}>{article.category}</span>
                      </div>
                      <ChevronRight size={16} />
                    </Link>
                  ))}
                  <Link href={`/support/help-center?q=${searchQuery}`} className={styles.seeAll}>
                    See all results for "{searchQuery}" <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="container">
        <div className={styles.shortcuts}>
          <Link href="/support/chat" className={styles.shortcutCard}>
            <div className={`${styles.iconCircle} ${styles.chatIcon}`}>
              <MessageCircle size={24} />
            </div>
            <h3>Live Chat</h3>
            <p>Speak with our AI assistant or a live agent.</p>
          </Link>
          <Link href="/customer-care" className={styles.shortcutCard}>
            <div className={`${styles.iconCircle} ${styles.ticketIcon}`}>
              <FileText size={24} />
            </div>
            <h3>My Tickets</h3>
            <p>Track your cases and resolution progress.</p>
          </Link>
        </div>

        <div className={styles.categoriesSection}>
          <h2 className={styles.sectionTitle}>Browse by Category</h2>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/support/help-center?category=${cat.name}`}
                className={styles.categoryCard}
              >
                <cat.icon size={32} className={styles.catIcon} />
                <h3>{cat.name}</h3>
                <p>Common issues and guides about {cat.name.toLowerCase()}.</p>
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.trendingSection}>
          <h2 className={styles.sectionTitle}>Trending Articles</h2>
          <div className={styles.articleList}>
            <Link href="/support/help-center/track-order" className={styles.articleItem}>
              <div className={styles.articleInfo}>
                <h4>How to Track Your Order</h4>
                <p>Live shipment updates and tracking info.</p>
              </div>
              <ChevronRight size={20} />
            </Link>
            <Link href="/support/help-center/return-refund-policy" className={styles.articleItem}>
              <div className={styles.articleInfo}>
                <h4>Return and Refund Policy</h4>
                <p>Guidelines for damaged or missing items.</p>
              </div>
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
