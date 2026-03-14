"use client";

import { useAccountData } from "@/context/AccountDataContext";
import { Package, Search, Filter, ChevronRight } from "lucide-react";
import styles from "./OrderList.module.css";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export function OrderList() {
  const { orders, isLoading } = useAccountData();

  if (isLoading) return <div className={styles.loading}>Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <Package size={60} />
        <h2>No Orders Found</h2>
        <p>You haven't placed any orders yet. Once you do, they'll appear here.</p>
        <Link href="/products" className={styles.shopBtn}>Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Orders</h1>
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <Search size={18} />
            <input type="text" placeholder="Search orders..." />
          </div>
          <button className={styles.filterBtn}>
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </header>

      <div className={styles.list}>
        {orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderMain}>
              <div className={styles.orderInfo}>
                <p className={styles.orderNumber}>ORDER #{order.order_number}</p>
                <div className={styles.meta}>
                  <span>Placed on {new Date(order.placed_at).toLocaleDateString()}</span>
                  <span className={styles.dot}>•</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
              <div className={styles.statusSection}>
                <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                  {order.status}
                </span>
                <div className={styles.cardActions}>
                  <Link href={`/account/orders/${order.id}`} className={styles.detailsBtn}>
                    Details <ChevronRight size={16} />
                  </Link>
                  <Link href={`/account/issues/new?orderId=${order.id}`} className={styles.reportBtn}>
                    Report Issue
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
