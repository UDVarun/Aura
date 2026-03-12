"use client";

import { useAccountData } from "@/context/AccountDataContext";
import { History, Package, User, Star, CreditCard, Shield, Bell } from "lucide-react";
import styles from "./ActivityLog.module.css";

const iconMap: Record<string, any> = {
  order_placed: Package,
  profile_updated: User,
  review_submitted: Star,
  refund_processed: History,
  address_added: Package, // MapPin or Package
  security_update: Shield,
  payment_method_added: CreditCard,
  notification_received: Bell,
  default: History
};

export function ActivityLog() {
  const { activities, isLoading } = useAccountData();

  if (isLoading) return <div className={styles.loading}>Loading activity history...</div>;

  if (activities.length === 0) {
    return (
      <div className={styles.empty}>
        <History size={60} />
        <h2>No activity yet</h2>
        <p>Your recent account actions will appear here.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Account Activity</h1>
      <p className={styles.subtitle}>Track your recent orders, profile changes, and security events.</p>

      <div className={styles.timeline}>
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type] || iconMap.default;
          return (
            <div key={activity.id} className={styles.item}>
              <div className={styles.marker}>
                <div className={styles.iconCircle}>
                  <Icon size={18} />
                </div>
                {index < activities.length - 1 && <div className={styles.line} />}
              </div>
              <div className={styles.content}>
                <div className={styles.timeInfo}>
                   <span className={styles.date}>{new Date(activity.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                   <span className={styles.time}>{new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={styles.details}>
                  <p className={styles.description}>{activity.description}</p>
                  <span className={styles.typeBadge}>{activity.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
