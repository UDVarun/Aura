"use client";

import { useState } from "react";
import { useAccountData, UserAddress } from "@/context/AccountDataContext";
import { MapPin, Plus, Edit2, Trash2, CheckCircle } from "lucide-react";
import styles from "./AddressManager.module.css";
import { createClient } from "@/lib/supabase/client";

export function AddressManager() {
  const { addresses, refreshAccountData } = useAccountData();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<UserAddress> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleEdit = (address: UserAddress) => {
    setCurrentAddress(address);
    setIsEditing(true);
  };

  const handleAdd = () => {
    setCurrentAddress({
      label: "Home",
      country: "India",
      is_default: addresses.length === 0,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    const { error } = await supabase.from("user_addresses").delete().eq("id", id);
    if (!error) refreshAccountData();
  };

  const handleSetDefault = async (id: string) => {
    // First, unset all defaults
    await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .neq("id", id);
    
    // Then set the new default
    const { error } = await supabase
      .from("user_addresses")
      .update({ is_default: true })
      .eq("id", id);
    
    if (!error) refreshAccountData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const addressData = {
      ...currentAddress,
      user_id: user.id,
    };

    let error;
    if (currentAddress?.id) {
      const { error: err } = await supabase
        .from("user_addresses")
        .update(addressData)
        .eq("id", currentAddress.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("user_addresses")
        .insert([addressData]);
      error = err;
    }

    setIsSubmitting(false);
    if (!error) {
      setIsEditing(false);
      refreshAccountData();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Addresses</h1>
        <button onClick={handleAdd} className={styles.addBtn}>
          <Plus size={18} />
          <span>Add New Address</span>
        </button>
      </div>

      <div className={styles.grid}>
        {addresses.map((address) => (
          <div key={address.id} className={`${styles.card} ${address.is_default ? styles.defaultCard : ''}`}>
            {address.is_default && (
              <div className={styles.defaultBadge}>
                <CheckCircle size={12} />
                DEFAULT
              </div>
            )}
            <div className={styles.cardHeader}>
              <h3 className={styles.label}>{address.label}</h3>
              <div className={styles.actions}>
                <button onClick={() => handleEdit(address)} className={styles.actionBtn} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(address.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className={styles.details}>
              <p className={styles.recipient}>{address.recipient_name}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{address.city}, {address.state} - {address.postal_code}</p>
              <p>{address.country}</p>
              {address.phone && <p className={styles.phone}>Phone: {address.phone}</p>}
            </div>

            {!address.is_default && (
              <button 
                onClick={() => handleSetDefault(address.id)} 
                className={styles.setDefaultBtn}
              >
                Set as Default
              </button>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{currentAddress?.id ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Address Label (e.g. Home, Office)</label>
                <input 
                  required
                  value={currentAddress?.label || ''} 
                  onChange={e => setCurrentAddress({...currentAddress, label: e.target.value})}
                  placeholder="Home"
                />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Recipient Name</label>
                  <input 
                    required
                    value={currentAddress?.recipient_name || ''} 
                    onChange={e => setCurrentAddress({...currentAddress, recipient_name: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input 
                    value={currentAddress?.phone || ''} 
                    onChange={e => setCurrentAddress({...currentAddress, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Address Line 1</label>
                <input 
                  required
                  value={currentAddress?.line1 || ''} 
                  onChange={e => setCurrentAddress({...currentAddress, line1: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Address Line 2 (Optional)</label>
                <input 
                  value={currentAddress?.line2 || ''} 
                  onChange={e => setCurrentAddress({...currentAddress, line2: e.target.value})}
                />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>City</label>
                  <input 
                    required
                    value={currentAddress?.city || ''} 
                    onChange={e => setCurrentAddress({...currentAddress, city: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>State</label>
                  <input 
                    required
                    value={currentAddress?.state || ''} 
                    onChange={e => setCurrentAddress({...currentAddress, state: e.target.value})}
                  />
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Postal Code</label>
                  <input 
                    required
                    value={currentAddress?.postal_code || ''} 
                    onChange={e => setCurrentAddress({...currentAddress, postal_code: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Country</label>
                  <input 
                    required
                    value={currentAddress?.country || ''} 
                    onChange={e => setCurrentAddress({...currentAddress, country: e.target.value})}
                  />
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                  {isSubmitting ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
