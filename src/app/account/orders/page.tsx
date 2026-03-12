import { OrderList } from "@/components/account/OrderList";

export const metadata = {
  title: "My Orders - Aura",
  description: "View and track your previous orders.",
};

export default function OrdersPage() {
  return <OrderList />;
}
