import { SupportInbox } from "@/components/marketplace/SupportInbox";

export default function AdminCasesPage() {
    return (
        <div>
            <SupportInbox
                role="admin"
                title="Marketplace case queue"
                subtitle="Review escalations, investigate vendor conduct, and resolve customer disputes with a complete message trail."
            />
        </div>
    );
}
