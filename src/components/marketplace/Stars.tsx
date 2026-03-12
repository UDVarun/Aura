"use client";

import React from "react";
import { Star } from "lucide-react";
import styles from "./Stars.module.css";

interface StarsProps {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
}

export function Stars({ rating, count, size = 16, showCount = true }: StarsProps) {
  return (
    <div className={styles.ratingContainer}>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={i <= Math.round(rating) ? styles.starFilled : styles.starEmpty}
            fill={i <= Math.round(rating) ? "currentColor" : "none"}
          />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className={styles.reviewLink}>
          ({count})
        </span>
      )}
    </div>
  );
}
