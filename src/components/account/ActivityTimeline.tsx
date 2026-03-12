"use client";

import { useAccountData } from "@/context/AccountDataContext";
import { History, CheckCircle, Package, User, Star } from "lucide-react";
import styles from "./ActivityTimeline.module.css";

const iconMap: Record<string, any> = {
  order_placed: Package,
  profile_updated: User,
  review_submitted: Star,
  refund_processed: History,
  default: CheckCircle
};

export function ActivityTimeline() {
  const { activities } = useAccountData();

  if (activities.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No recent activity.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Recent Activity</h2>
      <div className={styles.timeline}>
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type] || iconMap.default;
          return (
            <div key={activity.id} className={styles.item}>
              <div className={styles.iconSlot}>
                <div className={styles.iconCircle}>
                  <Icon size={16} />
                </div>
                {index < activities.length - 1 && <div className={styles.connector} />}
              </div>
              <div className={styles.content}>
                <p className={styles.description}>{activity.description}</p>
                <span className={styles.date}>
                  {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
