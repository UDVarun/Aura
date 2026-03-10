import Link from "next/link";
import styles from "../page.module.css";
import { createServerSupabase } from "@/lib/supabase/server";
import { VendorActions } from "@/components/admin/VendorActions";

interface AdminVendorRow {
    id: string;
    store_name: string;
    status: string;
    created_at: string;
    user_id: string;
}

export default async function AdminVendorsPage() {
    const supabase = await createServerSupabase();
    const { data: vendorsData } = await supabase
        .from("vendors")
        .select("id, store_name, status, created_at, user_id")
        .order("created_at", { ascending: false });

    const vendors: AdminVendorRow[] = vendorsData || [];

    const userIds = vendors.map((vendor) => vendor.user_id);
    const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", Array.from(new Set(userIds)));

    const profiles = profilesData || [];

    const profileMap = profiles.reduce<Record<string, string>>((acc: Record<string, string>, profile: { id: string; email: string }) => {
        if (profile.id && profile.email) {
            acc[profile.id] = profile.email;
        }
        return acc;
    }, {});

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Vendors</h1>
                    <p className={styles.pageSubtitle}>Review applications and approve new sellers.</p>
                </div>
                <Link href="/admin/vendors" className="btn btn-secondary">
                    Refresh list
                </Link>
            </div>

            <div className={styles.section}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Email</th>
                                <th>Store</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map((vendor) => (
                                <tr key={vendor.id} className={styles.tableRow}>
                                    <td>{profileMap[vendor.user_id] ?? "Unknown vendor"}</td>
                                    <td>{profileMap[vendor.user_id] ?? "—"}</td>
                                    <td>{vendor.store_name}</td>
                                    <td>{vendor.status}</td>
                                    <td>
                                        <VendorActions vendorId={vendor.id} currentStatus={vendor.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
