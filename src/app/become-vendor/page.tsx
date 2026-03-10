"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

type VendorForm = {
    store_name: string;
    store_description: string;
    phone: string;
    address: string;
    business_category: string;
    government_id: string;
    gst_number: string;
};

export default function BecomeVendorPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState<VendorForm>({
        store_name: "",
        store_description: "",
        phone: "",
        address: "",
        business_category: "",
        government_id: "",
        gst_number: "",
    });
    const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
    const [message, setMessage] = useState<string | null>(null);
    const [existing, setExisting] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace("/login");
            return;
        }

        let active = true;
        if (!user) return;
        fetch("/api/vendors/me")
            .then((res) => res.json())
            .then((payload) => {
                if (!active) return;
                const vendor = payload.vendor;
                if (vendor) {
                    setExisting(vendor.status);
                    setForm((prev) => ({
                        ...prev,
                        store_name: vendor.store_name ?? prev.store_name,
                        store_description: vendor.store_description ?? prev.store_description,
                        phone: vendor.phone ?? prev.phone,
                        address: vendor.address ?? prev.address,
                        business_category: vendor.business_category ?? prev.business_category,
                        government_id: vendor.government_id ?? prev.government_id,
                        gst_number: vendor.gst_number ?? prev.gst_number,
                    }));
                }
            });
        return () => {
            active = false;
        };
    }, [isLoading, router, user]);

    if (isLoading || !user) {
        return null;
    }

    const handleChange = (key: keyof VendorForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus("loading");
        setMessage(null);

        const res = await fetch("/api/vendors/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) {
            setMessage(data.error || "Failed to submit application.");
            setStatus("idle");
            return;
        }

        setExisting("pending");
        setMessage("Vendor application submitted. Admin will review shortly.");
        setStatus("submitted");
    };

    return (
        <div className={styles.becomeVendorPage}>
            <div className={styles.card}>
                <h1 className={styles.title}>Become a vendor</h1>
                <p className={styles.lead}>
                    Build your store on Aura, list premium products, and manage your inventory from a unified dashboard.
                </p>
                {existing && (
                    <div className={styles.status}>
                        Current status: <strong>{existing}</strong>
                    </div>
                )}
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label}>
                        Store name
                        <input
                            value={form.store_name}
                            onChange={handleChange("store_name")}
                            required
                            className={`input ${styles.input}`}
                            placeholder="Aura Studio"
                        />
                    </label>
                    <label className={styles.label}>
                        Store description
                        <textarea
                            value={form.store_description}
                            onChange={handleChange("store_description")}
                            required
                            className={`input ${styles.input}`}
                            placeholder="Curated high-end audio and lifestyle accessories."
                            rows={3}
                        />
                    </label>
                    <label className={styles.label}>
                        Phone
                        <input
                            value={form.phone}
                            onChange={handleChange("phone")}
                            required
                            className={`input ${styles.input}`}
                            placeholder="+91 98765 43210"
                        />
                    </label>
                    <label className={styles.label}>
                        Address
                        <input
                            value={form.address}
                            onChange={handleChange("address")}
                            required
                            className={`input ${styles.input}`}
                            placeholder="123 Aura Plaza, Bangalore"
                        />
                    </label>
                    <label className={styles.label}>
                        Product category
                        <input
                            value={form.business_category}
                            onChange={handleChange("business_category")}
                            required
                            className={`input ${styles.input}`}
                            placeholder="Audio, fashion, home decor..."
                        />
                    </label>
                    <label className={styles.label}>
                        Government ID (optional)
                        <input
                            value={form.government_id}
                            onChange={handleChange("government_id")}
                            className={`input ${styles.input}`}
                            placeholder="PAN, Aadhaar, or business ID reference"
                        />
                    </label>
                    <label className={styles.label}>
                        GST number (optional)
                        <input
                            value={form.gst_number}
                            onChange={handleChange("gst_number")}
                            className={`input ${styles.input}`}
                            placeholder="22AAAAA0000A1Z5"
                        />
                    </label>
                    {message && <p className={styles.message}>{message}</p>}
                    <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
                        {existing === "pending" ? "Update application" : "Submit application"}
                    </button>
                </form>
            </div>
        </div>
    );
}
