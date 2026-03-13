"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, Book, ArrowLeft } from "lucide-react";
import styles from "./help-center.module.css";

function HelpCenterContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [initialQuery, initialCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let url = "/api/support/articles";
      const params = new URLSearchParams();
      if (initialQuery) params.append("q", initialQuery);
      if (initialCategory) params.append("category", initialCategory);
      
      const res = await fetch(`${url}?${params.toString()}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/support" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Support Hub
          </Link>
          <h1 className={styles.title}>
            {initialCategory ? `Browse: ${initialCategory}` : initialQuery ? `Results for: ${initialQuery}` : "Knowledge Base"}
          </h1>
        </div>
      </header>

      <section className="container">
        <div className={styles.content}>
          <aside className={styles.sidebar}>
            <h3>Categories</h3>
            <ul className={styles.categoryList}>
              {["Shipping", "Refunds", "Communication", "Security"].map((cat) => (
                <li key={cat}>
                  <Link 
                    href={`/support/help-center?category=${cat}`}
                    className={initialCategory === cat ? styles.activeCategory : ""}
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <div className={styles.results}>
            {loading ? (
              <div className={styles.loading}>Searching our base...</div>
            ) : articles.length > 0 ? (
              <div className={styles.articleGrid}>
                {articles.map((article: any) => (
                  <Link
                    key={article.id}
                    href={`/support/help-center/${article.slug}`}
                    className={styles.articleCard}
                  >
                    <Book className={styles.articleIcon} size={24} />
                    <div className={styles.articleInfo}>
                      <h3>{article.title}</h3>
                      <p>{article.category}</p>
                    </div>
                    <ChevronRight size={20} className={styles.arrow} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <h2>No articles found</h2>
                <p>Try different keywords or browse our categories.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function HelpCenterPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading Help Center...</div>}>
      <HelpCenterContent />
    </Suspense>
  );
}
