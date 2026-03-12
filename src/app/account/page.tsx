"use client";

import { ProfileHeader } from "@/components/account/ProfileHeader";
import { StatsDashboard } from "@/components/account/StatsDashboard";
import { OrderWidget } from "@/components/account/OrderWidget";
import { ActivityTimeline } from "@/components/account/ActivityTimeline";
import { ProfileHeaderSkeleton, StatsSkeleton, Skeleton } from "@/components/account/Skeleton";
import { useAccountData } from "@/context/AccountDataContext";
import styles from "./page.module.css";

export default function AccountPage() {
  const { isLoading } = useAccountData();

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <ProfileHeaderSkeleton />
        <StatsSkeleton />
        <div className={styles.widgetsGrid}>
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <ProfileHeader />
      <StatsDashboard />
      <div className={styles.widgetsGrid}>
        <OrderWidget />
        <ActivityTimeline />
      </div>
    </div>
  );
}

