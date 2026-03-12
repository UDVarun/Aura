"use client";

import styles from "./Skeleton.module.css";

export function Skeleton({ className, width, height, circle }: { className?: string, width?: string | number, height?: string | number, circle?: boolean }) {
  return (
    <div 
      className={`${styles.skeleton} ${className}`} 
      style={{ 
        width, 
        height, 
        borderRadius: circle ? '50%' : 'var(--radius-md)' 
      }} 
    />
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className={styles.skeletonWrapper}>
      <div className={styles.profileSection}>
        <Skeleton width={80} height={80} circle />
        <div className={styles.userInfo}>
          <Skeleton width={150} height={24} />
          <Skeleton width={200} height={16} />
          <div className={styles.badges}>
            <Skeleton width={60} height={20} />
            <Skeleton width={100} height={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className={styles.statsGrid}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height={100} />
      ))}
    </div>
  );
}
