"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from "lucide-react";
import styles from "./analytics.module.css";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/support/analytics")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.loading}>Generating Analytics...</div>;

  const statusMax = Math.max(...Object.values(data.statusCounts || {}) as number[], 1);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Advanced Support Analytics</h1>
          <p className={styles.subtitle}>Deep dive into service level performance and customer satisfaction.</p>
        </div>
        <div className={styles.dateFilter}>
          <Calendar size={18} />
          <span>Last 30 Days</span>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Key Metrics */}
        <div className={styles.thirdWidth}>
          <div className={styles.card}>
            <div className={styles.cardTitle}><Star size={20} color="#f59e0b" /> CSAT Score</div>
            <div className={styles.metricGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>{data.avgCSAT}</span>
                <span className={styles.metricLabel}>Average</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>{data.csatCount}</span>
                <span className={styles.metricLabel}>Total Reviews</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.thirdWidth}>
          <div className={styles.card}>
            <div className={styles.cardTitle}><TrendingUp size={20} color="#10b981" /> Throughput</div>
            <div className={styles.metricGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>{data.statusCounts.resolved || 0}</span>
                <span className={styles.metricLabel}>Resolved</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>
                  {data.statusCounts.open || 0}
                </span>
                <span className={styles.metricLabel}>Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.thirdWidth}>
          <div className={styles.card}>
            <div className={styles.cardTitle}><Clock size={20} color="#3b82f6" /> Response SLA</div>
            <div className={styles.metricGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>12m</span>
                <span className={styles.metricLabel}>Avg First Response</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>1.4h</span>
                <span className={styles.metricLabel}>Avg Resolution</span>
              </div>
            </div>
          </div>
        </div>

        {/* Case Distribution Chart */}
        <div className={styles.halfWidth}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}><BarChart3 size={20} /> Case Distribution by Status</div>
            </div>
            <div className={styles.chartContainer}>
              {Object.entries(data.statusCounts).map(([status, count]: [string, any]) => (
                <div key={status} className={styles.barWrapper}>
                  <div 
                    className={styles.bar} 
                    style={{ 
                      height: `${(count / statusMax) * 100}%`,
                      background: status === 'resolved' ? '#10b981' : status === 'escalated' ? '#ef4444' : '#3b82f6'
                    }}
                  />
                  <span className={styles.barLabel}>{status} ({count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Performance List */}
        <div className={styles.halfWidth}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}><Users size={20} /> Agent Performance</div>
            </div>
            <div className={styles.agentList}>
              {data.agents.map((agent: any) => (
                <div key={agent.full_name} className={styles.agentRow}>
                  <span className={styles.agentName}>{agent.full_name}</span>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className={styles.agentRating}>
                      <Star size={14} fill="#f59e0b" />
                      {agent.rating || '5.0'}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {agent.active_cases_count} cases
                    </span>
                  </div>
                </div>
              ))}
              {data.agents.length === 0 && <p className={styles.empty}>No active agents.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
