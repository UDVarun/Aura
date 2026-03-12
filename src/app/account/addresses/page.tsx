import { AddressManager } from "@/components/account/AddressManager";

export const metadata = {
  title: "My Addresses - Aura",
  description: "Manage your shipping and billing addresses.",
};

export default function AddressesPage() {
  return <AddressManager />;
}
