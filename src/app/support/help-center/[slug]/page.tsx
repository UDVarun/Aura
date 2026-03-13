import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag, ThumbsUp, ThumbsDown } from "lucide-react";
import styles from "./article.module.css";

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabase();

  const { data: article, error } = await supabase
    .from("support_articles")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !article) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/support/help-center" className={styles.backLink}>
            <ArrowLeft size={16} /> Help Center
          </Link>
          <div className={styles.meta}>
            <span className={styles.category}>{article.category}</span>
            <span className={styles.dot}>•</span>
            <span className={styles.date}>
              <Clock size={14} /> Last updated: {new Date(article.updated_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className={styles.title}>{article.title}</h1>
        </div>
      </header>

      <section className="container">
        <div className={styles.layout}>
          <article className={styles.article}>
            <div className={styles.content}>
              {article.content.split("\n").map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className={styles.feedback}>
              <h3>Was this article helpful?</h3>
              <div className={styles.feedbackButtons}>
                <button className={styles.feedbackBtn}>
                  <ThumbsUp size={18} /> Yes
                </button>
                <button className={styles.feedbackBtn}>
                  <ThumbsDown size={18} /> No
                </button>
              </div>
            </div>
          </article>

          <aside className={styles.sidebar}>
            <div className={styles.tagsBox}>
              <h3>Tags</h3>
              <div className={styles.tags}>
                {article.tags?.map((tag: string) => (
                  <span key={tag} className={styles.tag}>
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.relatedBox}>
              <h3>Related Support</h3>
              <Link href="/support/chat" className={styles.relatedLink}>
                Ask AI Assistant
              </Link>
              <Link href="/customer-care" className={styles.relatedLink}>
                Open a Support Case
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
