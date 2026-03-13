"use client";

import { useState } from "react";
import clsx from "clsx";
import { 
    Package, 
    AlertTriangle, 
    UserX, 
    ShoppingBag, 
    ChevronRight, 
    ChevronLeft, 
    Upload, 
    Check,
    X,
    FileText,
    Image as ImageIcon
} from "lucide-react";
import styles from "./GuidedCaseCreation.module.css";
import { createClient } from "@/lib/supabase/client";


type Step = "category" | "order" | "details" | "evidence";

type Category = {
    id: string;
    label: string;
    description: string;
    icon: any;
};

const CATEGORIES: Category[] = [
    { id: "order_issue", label: "Order Issue", description: "Damaged, wrong item, or delivery failure.", icon: Package },
    { id: "refund_request", label: "Refund Request", description: "Request a return or partial refund.", icon: ShoppingBag },
    { id: "seller_report", label: "Merchant Report", description: "Report fraudulent or unprofessional behavior.", icon: UserX },
    { id: "product_issue", label: "Product Defect", description: "Quality issues or technical failure.", icon: AlertTriangle },
];

export function GuidedCaseCreation({ 
    orders, 
    onCancel, 
    onCreate 
}: { 
    orders: any[], 
    onCancel: () => void,
    onCreate: (data: any) => Promise<void>
}) {
    const [step, setStep] = useState<Step>("category");
    const [form, setForm] = useState({
        category: "",
        orderId: "",
        priority: "normal",
        subject: "",
        description: "",
        evidence: [] as File[]
    });
    const [submitting, setSubmitting] = useState(false);

    const handleNext = () => {
        if (step === "category") setStep("order");
        else if (step === "order") setStep("details");
        else if (step === "details") setStep("evidence");
    };

    const handleBack = () => {
        if (step === "order") setStep("category");
        else if (step === "details") setStep("order");
        else if (step === "evidence") setStep("details");
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const supabase = createClient();
            const evidenceUrls = [];

            for (const file of form.evidence) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("support-evidence")
                    .upload(filePath, file);

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from("support-evidence")
                        .getPublicUrl(filePath);
                    evidenceUrls.push({
                        name: file.name,
                        url: data.publicUrl,
                        type: file.type
                    });
                } else {
                    console.error("Error uploading evidence:", uploadError);
                }
            }

            await onCreate({ ...form, evidenceUrls });
        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to submit support case. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };


    const progress = {
        category: 25,
        order: 50,
        details: 75,
        evidence: 100
    }[step];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h2 className={styles.title}>Open a Support Case</h2>
                    <button className={styles.closeBtn} onClick={onCancel}><X size={20} /></button>
                </div>
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className={styles.content}>
                {step === "category" && (
                    <div className={styles.stepContent}>
                        <h3 className={styles.stepTitle}>What's the nature of your issue?</h3>
                        <div className={styles.categoryGrid}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    className={clsx(styles.categoryCard, form.category === cat.id && styles.active)}
                                    onClick={() => {
                                        setForm({ ...form, category: cat.id });
                                        setStep("order");
                                    }}
                                >
                                    <div className={styles.categoryIcon}><cat.icon size={24} /></div>
                                    <div className={styles.categoryInfo}>
                                        <div className={styles.categoryLabel}>{cat.label}</div>
                                        <div className={styles.categoryDesc}>{cat.description}</div>
                                    </div>
                                    <ChevronRight size={20} className={styles.chevron} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === "order" && (
                    <div className={styles.stepContent}>
                        <h3 className={styles.stepTitle}>Which order is this about?</h3>
                        <div className={styles.orderList}>
                            <button 
                                className={clsx(styles.orderCard, !form.orderId && styles.active)}
                                onClick={() => {
                                    setForm({ ...form, orderId: "" });
                                    handleNext();
                                }}
                            >
                                <div className={styles.orderInfo}>
                                    <div className={styles.orderLabel}>Skip order selection</div>
                                    <div className={styles.orderDesc}>General inquiry or site-wide issue.</div>
                                </div>
                            </button>
                            {orders.map(order => (
                                <button
                                    key={order.id}
                                    className={clsx(styles.orderCard, form.orderId === order.id && styles.active)}
                                    onClick={() => {
                                        setForm({ ...form, orderId: order.id });
                                        handleNext();
                                    }}
                                >
                                    <div className={styles.orderInfo}>
                                        <div className={styles.orderLabel}>{order.order_number}</div>
                                        <div className={styles.orderDesc}>{new Date(order.placed_at).toLocaleDateString()} • {order.status}</div>
                                    </div>
                                    <Check size={20} className={styles.checkIcon} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === "details" && (
                    <div className={styles.stepContent}>
                        <h3 className={styles.stepTitle}>Tell us what happened</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Subject</label>
                            <input 
                                className="input" 
                                placeholder="e.g., Item arrived broken"
                                value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Priority</label>
                            <div className={styles.priorityGrid}>
                                {["normal", "high", "urgent"].map(p => (
                                    <button 
                                        key={p}
                                        className={clsx(styles.priorityBtn, form.priority === p && styles.active)}
                                        onClick={() => setForm({ ...form, priority: p })}
                                    >
                                        {p.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea 
                                className="input" 
                                rows={5}
                                placeholder="Please provide as much detail as possible to help us resolve this quickly."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {step === "evidence" && (
                    <div className={styles.stepContent}>
                        <h3 className={styles.stepTitle}>Upload Evidence (Optional)</h3>
                        <p className={styles.stepSubtitle}>Photos, screenshots, or documents help us resolve disputes faster.</p>
                        
                        <div className={styles.uploadArea}>
                            <Upload size={32} />
                            <div className={styles.uploadText}>
                                <strong>Click to upload</strong> or drag and drop
                            </div>
                            <div className={styles.uploadSubtext}>PNG, JPG, PDF up to 10MB</div>
                            <input 
                                type="file" 
                                multiple 
                                className={styles.fileInput} 
                                onChange={e => {
                                    if (e.target.files) {
                                        setForm({ ...form, evidence: [...form.evidence, ...Array.from(e.target.files)] });
                                    }
                                }}
                            />
                        </div>

                        {form.evidence.length > 0 && (
                            <div className={styles.fileList}>
                                {form.evidence.map((file, i) => (
                                    <div key={i} className={styles.fileCard}>
                                        <Package size={16} />
                                        <span className={styles.fileName}>{file.name}</span>
                                        <button 
                                            onClick={() => setForm({ ...form, evidence: form.evidence.filter((_, idx) => idx !== i) })}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                {step !== "category" && (
                    <button className="btn btn-secondary" onClick={handleBack} disabled={submitting}>
                        <ChevronLeft size={18} /> Back
                    </button>
                )}
                <div style={{ flexGrow: 1 }} />
                {step !== "evidence" ? (
                    <button 
                        className="btn btn-primary" 
                        onClick={handleNext} 
                        disabled={step === "details" && (!form.subject || !form.description)}
                    >
                        Next <ChevronRight size={18} />
                    </button>
                ) : (
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Creating Case..." : "Finish & Submit"}
                    </button>
                )}
            </footer>
        </div>
    );
}
