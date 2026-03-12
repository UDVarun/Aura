"use client";

import React, { useState, useEffect } from "react";
import styles from "./adminReviews.module.css";
import { Trash2, CheckCircle, Flag, ExternalLink, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface AdminReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  media_urls: string[];
  profiles: { id: string; email: string };
  products: { id: string; title: string };
  review_reports: { reason: string; status: string; reporter_id: string }[];
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("reported"); // reported, all

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/reviews");
    const data = await res.json();
    if (data.reviews) {
      setReviews(data.reviews);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAction = async (id: string, action: "resolve" | "delete") => {
    if (!confirm(`Are you sure you want to ${action} this review?`)) return;

    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: action === "resolve" ? "PATCH" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });

    if (res.ok) {
      fetchReviews();
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === "reported") return r.review_reports.length > 0;
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Review Moderation</h1>
        <div className={styles.filters}>
          <button 
            className={filter === "reported" ? styles.activeFilter : ""} 
            onClick={() => setFilter("reported")}
          >
            Reported Only
          </button>
          <button 
            className={filter === "all" ? styles.activeFilter : ""} 
            onClick={() => setFilter("all")}
          >
            All Reviews
          </button>
        </div>
      </header>

      {loading ? (
        <p>Loading reviews...</p>
      ) : (
        <div className={styles.grid}>
          {filteredReviews.length === 0 && <p>No reviews found matching the filter.</p>}
          {filteredReviews.map((review) => (
            <article key={review.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.productInfo}>
                  <strong>{review.products.title}</strong>
                  <Link href={`/products/${review.products.id}`} className={styles.link}>
                    View Product <ExternalLink size={14} />
                  </Link>
                </div>
                <div className={styles.badges}>
                  {review.review_reports.length > 0 && (
                    <span className={styles.reportBadge}>
                      <Flag size={14} /> {review.review_reports.length} Reports
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.reviewerRow}>
                <span className={styles.email}>{review.profiles.email}</span>
                <div className={styles.rating}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                        key={s} 
                        size={14} 
                        fill={s <= review.rating ? "#f5b840" : "none"} 
                        color="#f5b840" 
                    />
                  ))}
                </div>
                <span className={styles.date}>{new Date(review.created_at).toLocaleDateString()}</span>
              </div>

              <div className={styles.content}>
                <h4>{review.title}</h4>
                <p>{review.body}</p>
              </div>

              {review.media_urls.length > 0 && (
                <div className={styles.media}>
                  {review.media_urls.map((url, i) => (
                    <div key={i} className={styles.thumb}>
                      <Image src={url} alt="Media" fill objectFit="cover" />
                    </div>
                  ))}
                </div>
              )}

              {review.review_reports.length > 0 && (
                <div className={styles.reportsList}>
                  <h5>Report Reasons:</h5>
                  <ul>
                    {review.review_reports.map((report, i) => (
                      <li key={i}>{report.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.actions}>
                <button 
                  className={styles.resolveBtn}
                  onClick={() => handleAction(review.id, "resolve")}
                >
                  <CheckCircle size={16} /> Mark as Safe
                </button>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleAction(review.id, "delete")}
                >
                  <Trash2 size={16} /> Delete Review
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
