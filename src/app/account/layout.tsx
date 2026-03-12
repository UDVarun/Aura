"use client";

import { AccountSidebar } from "@/components/account/AccountSidebar";
import styles from "./layout.module.css";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className="container">
          <p>Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <main className={styles.page}>
      <div className={`container ${styles.container}`}>
        <div className={styles.layout}>
          <AccountSidebar />
          <div className={styles.content}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
