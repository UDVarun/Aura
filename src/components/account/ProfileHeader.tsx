"use client";

import { useRef, useState } from "react";
import { useAccountData } from "@/context/AccountDataContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Camera, Edit2, CheckCircle, ShieldCheck, X } from "lucide-react";
import styles from "./ProfileHeader.module.css";
import { createClient } from "@/lib/supabase/client";

export function ProfileHeader() {
  const { user } = useAuth();
  const { profile, completionPercentage, refreshAccountData } = useAccountData();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    phone: profile?.phone || "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleEditClick = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setIsEditing(false);
      refreshAccountData();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;

    try {
      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars') 
        .upload(`avatars/${filePath}`, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`avatars/${filePath}`);

      // 3. Update user_profiles
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;
      
      refreshAccountData();
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.profileSection}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            {profile?.avatar_url || user?.avatar ? (
              <Image 
                src={profile?.avatar_url || user?.avatar || ""} 
                alt={user?.name || "Profile"} 
                fill 
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <button 
            className={styles.avatarUpload} 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={14} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={handleAvatarUpload}
          />
        </div>

        <div className={styles.userInfo}>
          <h1 className={styles.userName}>
            {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : (user?.name || "User")}
            <ShieldCheck size={18} className={styles.verifiedIcon} />
          </h1>
          <p className={styles.userEmail}>{user?.email}</p>
          <div className={styles.badges}>
            <span className={styles.roleBadge}>{user?.role || "Customer"}</span>
            <span className={styles.joinedBadge}>Member since {new Date().getFullYear()}</span>
          </div>
        </div>

        <button onClick={handleEditClick} className={styles.editBtn}>
          <Edit2 size={16} />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className={styles.completionSection}>
        <div className={styles.completionInfo}>
          <span className={styles.completionLabel}>Account Completion</span>
          <span className={styles.completionValue}>{completionPercentage}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <p className={styles.completionTip}>
          {completionPercentage < 100 
            ? "Complete your profile to get personalized recommendations." 
            : "Your profile is fully optimized! ✨"}
        </p>
      </div>

      {isEditing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input 
                    value={formData.first_name} 
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input 
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
