import styles from "../products/page.module.css";
import { createServerSupabase } from "@/lib/supabase/server";

interface ProfileRow {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

interface VendorRow {
    user_id: string;
    status: string;
    store_name: string;
}

export default async function AdminUsersPage() {
    const supabase = await createServerSupabase();

    const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false });

    const { data: vendorsData } = await supabase
        .from("vendors")
        .select("user_id, status, store_name");

    const profiles: ProfileRow[] = profilesData ?? [];
    const vendorMap = new Map<string, VendorRow>((vendorsData ?? []).map((vendor) => [vendor.user_id, vendor]));

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Users</h1>
                    <p className={styles.pageSubtitle}>{profiles.length} marketplace accounts</p>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Vendor Status</th>
                                <th>Store</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((profile) => {
                                const vendor = vendorMap.get(profile.id);
                                return (
                                    <tr key={profile.id} className={styles.tableRow}>
                                        <td>{profile.email}</td>
                                        <td><span className="badge badge-blue">{profile.role}</span></td>
                                        <td>{vendor?.status ?? "-"}</td>
                                        <td>{vendor?.store_name ?? "-"}</td>
                                        <td>{new Date(profile.created_at).toLocaleDateString("en-IN")}</td>
                                    </tr>
                                );
                            })}
                            {profiles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles.emptyCell}>No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
