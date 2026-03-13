"use client";

import { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import styles from "./SupportWorkspace.module.css";

export function CSATFeedback({ caseId, onComplete }: { caseId: string, onComplete: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/support/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, rating, comment }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(onComplete, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.feedbackSuccess}>
        <CheckCircle2 size={32} color="#10b981" />
        <p>Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className={styles.feedbackContainer}>
      <h4>How was your experience?</h4>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
            className={styles.starBtn}
          >
            <Star 
              size={24} 
              fill={(hover || rating) >= s ? "var(--primary)" : "none"} 
              color={(hover || rating) >= s ? "var(--primary)" : "#71717a"} 
            />
          </button>
        ))}
      </div>
      <textarea
        placeholder="Any additional comments? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className={styles.feedbackText}
      />
      <button 
        className={styles.feedbackSubmit}
        disabled={rating === 0 || loading}
        onClick={handleSubmit}
      >
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}
