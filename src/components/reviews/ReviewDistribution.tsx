import React from 'react';
import styles from './ReviewDistribution.module.css';
import { Star } from 'lucide-react';

interface ReviewDistributionProps {
  distribution: Record<string, number>;
  totalCount: number;
  averageRating: number;
}

export default function ReviewDistribution({ distribution, totalCount, averageRating }: ReviewDistributionProps) {
  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.ratingValue}>{averageRating.toFixed(1)}</div>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={20}
              fill={i <= Math.round(averageRating) ? "#f5b840" : "none"}
              color="#f5b840"
            />
          ))}
        </div>
        <div className={styles.countText}>{totalCount} global ratings</div>
      </div>

      <div className={styles.bars}>
        {ratings.map((rating) => {
          const count = distribution[rating.toString()] || 0;
          const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
          
          return (
            <div key={rating} className={styles.barRow}>
              <span className={styles.barLabel}>{rating} star</span>
              <div className={styles.barWrapper}>
                <div 
                  className={styles.barFill} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className={styles.barPercentage}>{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
