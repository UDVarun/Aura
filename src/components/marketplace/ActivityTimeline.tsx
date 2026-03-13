"use client";

import { useEffect, useState } from "react";
import { 
    PlusCircle, 
    MessageCircle, 
    AlertTriangle, 
    CheckCircle2, 
    ShieldAlert, 
    RotateCcw,
    Image as ImageIcon,
    FileText
} from "lucide-react";
import styles from "./ActivityTimeline.module.css";

export type Activity = {
    id: string;
    type: string;
    message: string;
    created_at: string;
};

export function ActivityTimeline({ caseId }: { caseId: string }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) return;

        async function fetchActivities() {
            setLoading(true);
            try {
                const res = await fetch(`/api/support-cases/${caseId}/activities`);
                const data = await res.json();
                if (res.ok) {
                    setActivities(data.activities || []);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchActivities();
    }, [caseId]);

    const getIcon = (type: string) => {
        switch (type) {
            case "case_created": return <PlusCircle size={16} />;
            case "message_sent": return <MessageCircle size={16} />;
            case "status_changed": return <RotateCcw size={16} />;
            case "evidence_uploaded": return <ImageIcon size={16} />;
            case "escalated": return <ShieldAlert size={16} />;
            case "resolved": return <CheckCircle2 size={16} />;
            default: return <AlertTriangle size={16} />;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) return <div style={{ padding: "1rem", color: "var(--muted)" }}>Loading timeline...</div>;

    return (
        <div className={styles.timeline}>
            {activities.length === 0 ? (
                <div className={styles.empty}>No activities logged yet.</div>
            ) : (
                activities.map((a, i) => (
                    <div key={a.id} className={styles.item}>
                        <div className={styles.marker}>
                            <div className={styles.icon}>{getIcon(a.type)}</div>
                            {i !== activities.length - 1 && <div className={styles.line} />}
                        </div>
                        <div className={styles.content}>
                            <div className={styles.message}>{a.message}</div>
                            <div className={styles.date}>{formatDate(a.created_at)}</div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
