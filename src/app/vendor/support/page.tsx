"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import styles from "./vendor-support.module.css";

export default function VendorSupportDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/support/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.loading}>Loading Workspace...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Vendor Dispute Hub</h1>
          <p className={styles.subtitle}>Manage your customer cases and maintain your service rating.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/support/help-center" className={styles.secondaryBtn}>
            <HelpCircle size={18} /> Seller Guidelines
          </Link>
          <Link href="/vendor/communications" className={styles.primaryBtn}>
            Open Messaging Workspace
          </Link>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><ShieldAlert /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Disputes</span>
            <span className={styles.statValue}>{stats.active}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Clock /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Awaiting Your Response</span>
            <span className={styles.statValue}>{stats.waiting}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><CheckCircle2 /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Resolved Cases</span>
            <span className={styles.statValue}>{stats.resolved}</span>
          </div>
        </div>
      </div>

      <div className={styles.infoSection}>
        <div className={styles.infoCard}>
          <h3>Seller Performance Tip</h3>
          <p>Responding to disputes within 24 hours improves your visibility in search results and builds customer trust.</p>
          <Link href="/support/help-center/contact-seller" className={styles.learnMore}>
            Learn about response times <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
