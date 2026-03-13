import { SupportWorkspace } from "@/components/marketplace/SupportWorkspace";

export default function AdminCasesPage() {
    return (
        <div>
            <SupportWorkspace
                role="admin"
                title="Marketplace case queue"
                subtitle="Review escalations, investigate vendor conduct, and resolve customer disputes with a complete message trail."
            />
        </div>
    );
}
