"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  Search,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import styles from "./support.module.css";

export default function AdminSupportDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/support/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Support Command Center</h1>
          <p className={styles.subtitle}>Overview of marketplace health and agent performance.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/cases" className={styles.primaryBtn}>
            Manage Case Queue
          </Link>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><MessageSquare /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Tickets</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Clock /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Unresolved</span>
            <span className={styles.statValue}>{stats.total - stats.resolved}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><CheckCircle2 /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Resolution Rate</span>
            <span className={styles.statValue}>
              {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><TrendingUp /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Average CSAT</span>
            <span className={styles.statValue}>{stats.csat} / 5</span>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Urgent Escalations</h2>
            <Link href="/admin/cases?priority=urgent">View All</Link>
          </div>
          <div className={styles.urgentList}>
            {/* Logic to show high priority tickets */}
            <div className={styles.empty}>No urgent escalations at this time.</div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Quick Shortcuts</h2>
          </div>
          <div className={styles.shortcutGrid}>
            <Link href="/admin/support/analytics" className={styles.shortcut}>
              <BarChart3 size={20} />
              <span>Performance Analytics</span>
            </Link>
            <Link href="/support/help-center" className={styles.shortcut}>
              <Search size={20} />
              <span>Knowledge Base</span>
            </Link>
            <Link href="/admin/support/agents" className={styles.shortcut}>
              <Users size={20} />
              <span>Manage Agent Roster</span>
            </Link>
            <Link href="/admin/vendors" className={styles.shortcut}>
              <AlertTriangle size={20} />
              <span>Vendor Conduct</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
