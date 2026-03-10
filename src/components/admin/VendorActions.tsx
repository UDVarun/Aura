"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VendorActions({ vendorId, currentStatus }: { vendorId: string; currentStatus: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const updateStatus = async (status: "approved" | "rejected" | "suspended") => {
        setLoading(true);
        const res = await fetch(`/api/admin/vendors/${vendorId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        setLoading(false);
        if (res.ok) {
            router.refresh();
        }
    };

    if (currentStatus === "approved") {
        return (
            <div className="flex gap-2">
                <span className="badge badge-green">Approved</span>
                <button className="btn btn-secondary" onClick={() => updateStatus("suspended")} disabled={loading}>
                    Suspend
                </button>
            </div>
        );
    }

    if (currentStatus === "rejected" || currentStatus === "suspended") {
        return (
            <div className="flex gap-2">
                <span className={`badge ${currentStatus === "suspended" ? "badge-yellow" : "badge-red"}`}>
                    {currentStatus === "suspended" ? "Suspended" : "Rejected"}
                </span>
                <button className="btn btn-primary" onClick={() => updateStatus("approved")} disabled={loading}>
                    Approve
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => updateStatus("approved")} disabled={loading}>
                Approve
            </button>
            <button className="btn btn-secondary" onClick={() => updateStatus("rejected")} disabled={loading}>
                Reject
            </button>
        </div>
    );
}
