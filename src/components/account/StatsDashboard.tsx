"use client";

import { useAccountData } from "@/context/AccountDataContext";
import { ShoppingBag, Heart, Star, LifeBuoy } from "lucide-react";
import styles from "./StatsDashboard.module.css";
import Link from "next/link";

export function StatsDashboard() {
  const { orders, wishlistCount, reviewsCount, supportCasesCount } = useAccountData();

  const stats = [
    { 
      label: "Total Orders", 
      value: orders.length, 
      icon: ShoppingBag, 
      href: "/account/orders",
      color: "#3b82f6" 
    },
    { 
      label: "Wishlist Items", 
      value: wishlistCount, 
      icon: Heart, 
      href: "/account/wishlist",
      color: "#ef4444" 
    },
    { 
      label: "Reviews Submitted", 
      value: reviewsCount, 
      icon: Star, 
      href: "/account/reviews",
      color: "#f59e0b" 
    },
    { 
      label: "Support Cases", 
      value: supportCasesCount, 
      icon: LifeBuoy, 
      href: "/account/activity",
      color: "#10b981" 
    },
  ];

  return (
    <div className={styles.grid}>
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href} className={styles.card} style={{"--accent": stat.color} as any}>
          <div className={styles.iconWrapper}>
            <stat.icon size={24} />
          </div>
          <div className={styles.info}>
            <span className={styles.value}>{stat.value}</span>
            <span className={styles.label}>{stat.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
