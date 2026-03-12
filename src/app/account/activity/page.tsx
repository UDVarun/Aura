import { ActivityLog } from "@/components/account/ActivityLog";

export const metadata = {
  title: "Account Activity - Aura",
  description: "Review your recent account events and history.",
};

export default function ActivityPage() {
  return <ActivityLog />;
}
