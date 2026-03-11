import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/ui/CartDrawer";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AccountDataProvider } from "@/context/AccountDataContext";
import { NotificationProvider } from "@/context/NotificationContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={inter.variable}>
        <ThemeProvider>
          <AuthProvider>
            <AccountDataProvider>
              <CartProvider>
                <WishlistProvider>
                  <NotificationProvider>
                    <Navbar />
                    <CartDrawer />
                    <main>{children}</main>
                    <Footer />
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
