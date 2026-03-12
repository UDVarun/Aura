import { WishlistManager } from "@/components/account/WishlistManager";

export const metadata = {
  title: "My Wishlist - Aura",
  description: "View and manage items you've saved for later.",
};

export default function WishlistPage() {
  return <WishlistManager />;
}
