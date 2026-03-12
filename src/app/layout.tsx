import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AccountDataProvider } from "@/context/AccountDataContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { VendorProvider } from "@/context/VendorContext";
import AppChrome from "@/components/layout/AppChrome";

export const viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "Aura | Premium E-Commerce",
  description: "Discover a curated collection of premium lifestyle and tech products. Shop headphones, keyboards, home decor, and more.",
  keywords: ["ecommerce", "premium", "lifestyle", "electronics", "home decor"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AccountDataProvider>
              <CartProvider>
                <WishlistProvider>
                  <NotificationProvider>
                    <VendorProvider>
                      <AppChrome>{children}</AppChrome>
                    </VendorProvider>
                  </NotificationProvider>
                </WishlistProvider>
              </CartProvider>
            </AccountDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
