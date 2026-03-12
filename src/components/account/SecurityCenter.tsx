"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Lock, Smartphone, LogOut, CheckCircle2 } from "lucide-react";
import styles from "./SecurityCenter.module.css";
import { createClient } from "@/lib/supabase/client";

export function SecurityCenter() {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/account/security?reset=true`,
    });

    if (!error) {
      setSuccess("Password reset email sent! Please check your inbox.");
      setIsChangingPassword(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Security & Login</h1>

      {success && (
        <div className={styles.alert}>
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className={styles.sections}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><Lock size={20} /></div>
            <div className={styles.cardInfo}>
              <h3>Password</h3>
              <p>Change your password regularly to keep your account secure.</p>
            </div>
            <button 
              onClick={() => setIsChangingPassword(!isChangingPassword)} 
              className={styles.actionBtn}
            >
              Change
            </button>
          </div>
          
          {isChangingPassword && (
            <div className={styles.expandable}>
              <p className={styles.note}>We will send a password reset link to your registered email address <strong>{user?.email}</strong>.</p>
              <button onClick={handlePasswordReset} className={styles.submitBtn}>
                Send Reset Link
              </button>
            </div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><Smartphone size={20} /></div>
            <div className={styles.cardInfo}>
              <h3>Two-Factor Authentication (2FA)</h3>
              <p>Add an extra layer of security to your account.</p>
            </div>
            <span className={styles.statusBadge}>Recommended</span>
            <button className={styles.actionBtn}>Set Up</button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><ShieldCheck size={20} /></div>
            <div className={styles.cardInfo}>
              <h3>Active Sessions</h3>
              <p>You are currently logged in on this device.</p>
            </div>
          </div>
          <div className={styles.sessionItem}>
            <div className={styles.sessionIcon}><Smartphone size={16} /></div>
            <div className={styles.sessionDetails}>
              <p className={styles.device}>Chrome on Windows (Current Session)</p>
              <p className={styles.location}>New Delhi, India • Active now</p>
            </div>
          </div>
          <button className={styles.secondaryBtn}>Sign Out of All Other Devices</button>
        </section>
      </div>
    </div>
  );
}
