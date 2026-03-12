"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User2, 
  ShoppingBag, 
  MapPin, 
  Heart, 
  Star, 
  Bell, 
  ShieldCheck, 
  LifeBuoy, 
  History,
  LogOut
} from "lucide-react";
import styles from "./AccountSidebar.module.css";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

const navItems = [
  { label: "Profile", icon: User2, href: "/account" },
  { label: "Orders", icon: ShoppingBag, href: "/account/orders" },
  { label: "Addresses", icon: MapPin, href: "/account/addresses" },
  { label: "Wishlist", icon: Heart, href: "/account/wishlist" },
  { label: "My Reviews", icon: Star, href: "/account/reviews" },
  { label: "Notifications", icon: Bell, href: "/account/notifications" },
  { label: "Security", icon: ShieldCheck, href: "/account/security" },
  { label: "Activity", icon: History, href: "/account/activity" },
  { label: "Customer Care", icon: LifeBuoy, href: "/customer-care" },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(styles.navLink, {
              [styles.navLinkActive]: pathname === item.href,
            })}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <button 
        onClick={() => logout()} 
        className={styles.logoutBtn}
      >
        <LogOut size={18} />
        <span>Sign Out</span>
      </button>
    </aside>
  );
}
