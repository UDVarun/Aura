"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/ui/CartDrawer";

type AppChromeProps = {
  children: React.ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isWorkspaceRoute = pathname.startsWith("/vendor") || pathname.startsWith("/admin");

  if (isWorkspaceRoute) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
    </>
  );
}
