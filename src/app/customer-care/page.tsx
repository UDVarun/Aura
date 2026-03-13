"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, ShieldCheck, Truck, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SupportWorkspace } from "@/components/marketplace/SupportWorkspace";
import { GuidedCaseCreation } from "@/components/marketplace/GuidedCaseCreation";
import styles from "./page.module.css";

type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  placed_at: string;
};

const PILLARS = [
  {
    title: "Protected escalations",
    desc: "Every seller conversation, refund request, and dispute stays inside Aura for evidence-backed resolution.",
    Icon: ShieldCheck,
  },
  {
    title: "Vendor accountability",
    desc: "Support cases route directly to the responsible seller first, then escalate to admin when SLA or trust issues appear.",
    Icon: MessageSquare,
  },
  {
    title: "Order issue recovery",
    desc: "Wrong item, damage, delivery failure, or suspicious seller activity can be reported from one workflow.",
    Icon: AlertTriangle,
  },
  {
    title: "Fulfillment visibility",
    desc: "Support is tied to live order states, shipment updates, and post-delivery review history.",
    Icon: Truck,
  },
];

export default function CustomerCarePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetch("/api/orders/me")
      .then((res) => res.json())
      .then((payload) => {
        setOrders(payload.orders ?? []);
      });
  }, [isAuthenticated]);

  const handleCreateCase = async (formData: any) => {
    try {
      const res = await fetch("/api/support-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsCreating(false);
        setRefreshKey(prev => prev + 1); // Trigger refresh in workspace
      }
    } catch (err) {
      console.error("Failed to create case:", err);
    }
  };

  return (
    <main className={styles.page}>
      <section className={`container ${styles.hero}`}>
        <p className={styles.eyebrow}>Customer Care</p>
        <h1 className={styles.title}>A marketplace support workflow built for trust, evidence, and clear ownership.</h1>
        <p className={styles.subtitle}>
          Aura Customer Care connects your orders, seller communication, refund requests, and admin escalations in one protected workspace.
        </p>
        <div className={styles.actions}>
          <Link href="/products" className={styles.primaryAction}>Continue Shopping</Link>
          {!isAuthenticated && <Link href="/login?redirect=/customer-care" className={styles.secondaryAction}>Sign In to Open a Case</Link>}
        </div>
      </section>

      <section className={`container ${styles.pillars}`}>
        <h2 className={styles.sectionTitle}>Support principles</h2>
        <div className={styles.grid}>
          {PILLARS.map(({ title, desc, Icon }) => (
            <article key={title} className={styles.card}>
              <div className={styles.channelIcon}>
                <Icon size={18} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.mainSection}>
        {isLoading ? (
          <div className={`container ${styles.formCard}`}>Loading your support workspace...</div>
        ) : !isAuthenticated ? (
          <div className={`container ${styles.formCard}`}>
            <h2>Sign in to manage cases</h2>
            <p className={styles.formHint}>
              Once signed in, you can report product issues, request refunds, escalate fraudulent sellers, and continue case conversations with vendors or admin.
            </p>
            <Link href="/login?redirect=/customer-care" className="btn btn-primary">
              Go to Sign In
            </Link>
          </div>
        ) : isCreating ? (
          <div className="container">
            <GuidedCaseCreation 
              orders={orders} 
              onCancel={() => setIsCreating(false)} 
              onCreate={handleCreateCase}
            />
          </div>
        ) : (
          <div className={styles.workspaceContainer}>
            <div className={`container ${styles.workspaceHeader}`}>
                <div className="flex-between">
                    <div>
                        <h2 className={styles.sectionTitle}>Your support cases</h2>
                        <p className={styles.sectionSubtitle}>Continue an existing case or open a new dispute with the seller.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                        <Plus size={18} /> New Case
                    </button>
                </div>
            </div>
            <SupportWorkspace
                key={refreshKey}
                role="customer"
                title="Your support cases"
                subtitle="Open a new dispute or continue an existing case with the seller and Aura admin."
            />
          </div>
        )}
      </section>
    </main>
  );
}
