"use client";

import { useNotifications } from "@/context/NotificationContext";
import { Bell, CheckCircle2, Info, AlertCircle, ShoppingBag, Trash2, CheckCircle } from "lucide-react";
import styles from "./NotificationCenter.module.css";
import clsx from "clsx";

const iconMap: Record<string, any> = {
  order: ShoppingBag,
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
  default: Bell
};

export function NotificationCenter() {
  const { notifications, isLoading, markAsRead, deleteNotification, markAllAsRead } = useNotifications();

  if (isLoading) return <div className={styles.loading}>Loading notifications...</div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
            <h1 className={styles.title}>Notifications</h1>
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount} New</span>}
        </div>
        {notifications.length > 0 && (
          <button onClick={markAllAsRead} className={styles.markAllBtn}>
            <CheckCircle size={16} />
            <span>Mark all as read</span>
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <Bell size={60} fill="#e5e7eb" stroke="#e5e7eb" />
          <h2>All caught up!</h2>
          <p>You don't have any notifications at the moment.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type as string] || iconMap.default;
            return (
              <div 
                key={notification.id} 
                className={clsx(styles.item, { [styles.unread]: !notification.is_read })}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className={clsx(styles.iconWrapper, styles[notification.type as string])}>
                  <Icon size={20} />
                </div>
                <div className={styles.content}>
                  <h3 className={styles.notifTitle}>{notification.title}</h3>
                  <p className={styles.message}>{notification.message}</p>
                  <span className={styles.date}>
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }} 
                  className={styles.deleteBtn}
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
