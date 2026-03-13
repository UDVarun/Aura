"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Star, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import styles from "./agents.module.css";

export default function AdminAgentManagement() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/support/agents");
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch agents", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAgentStatus = async (agentId: string, status: string) => {
    try {
      await fetch("/api/admin/support/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agentId, status })
      });
      fetchAgents();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading Agent Roster...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Support Agent Roster</h1>
          <p className={styles.subtitle}>Manage availability and monitor performance of support staff.</p>
        </div>
        <button className={`${styles.btn} ${styles.primaryBtn}`}>
          <UserPlus size={18} style={{ marginRight: '8px' }} />
          Provision New Agent
        </button>
      </header>

      <div className={styles.agentGrid}>
        {agents.map(agent => (
          <div key={agent.id} className={styles.agentCard}>
            <div className={styles.agentHeader}>
              <div className={styles.avatar}>
                {agent.full_name?.charAt(0) || <Shield size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 className={styles.agentName}>{agent.full_name}</h3>
                <span className={`${styles.statusBadge} ${styles['status_' + agent.status]}`}>
                  {agent.status}
                </span>
              </div>
            </div>

            <div className={styles.capacityBar}>
              <div 
                className={styles.capacityFill} 
                style={{ width: `${(agent.active_cases_count / agent.max_cases_capacity) * 100}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '1rem' }}>
              <span>Load: {agent.active_cases_count} / {agent.max_cases_capacity}</span>
              <span>{(agent.active_cases_count / agent.max_cases_capacity * 100).toFixed(0)}%</span>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{agent.rating || 5.0}</span>
                <span className={styles.statLabel}><Star size={12} /> Rating</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{agent.active_cases_count}</span>
                <span className={styles.statLabel}><Activity size={12} /> Active</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {agent.last_assigned_at ? new Date(agent.last_assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
                <span className={styles.statLabel}><Clock size={12} /> Last Task</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.btn}
                onClick={() => updateAgentStatus(agent.id, agent.status === 'online' ? 'offline' : 'online')}
              >
                {agent.status === 'online' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                {agent.status === 'online' ? ' Go Offline' : ' Go Online'}
              </button>
              <Link href={`/admin/support/agents/${agent.id}`} className={styles.btn}>
                <ExternalLink size={14} /> View Stats
              </Link>
            </div>
          </div>
        ))}

        {agents.length === 0 && (
          <div className={styles.empty}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No agents have been provisioned yet.</p>
            <p style={{ fontSize: '0.875rem' }}>Add profiles to the `support_agents` table to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
