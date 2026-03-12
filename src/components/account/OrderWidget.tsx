"use client";

import { useAccountData } from "@/context/AccountDataContext";
import { Package, ArrowRight, Truck } from "lucide-react";
import styles from "./OrderWidget.module.css";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export function OrderWidget() {
  const { orders } = useAccountData();

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <Package size={40} />
        <p>No orders yet. Start shopping to see your purchases here!</p>
        <Link href="/products" className={styles.shopBtn}>Explore Products</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Orders</h2>
        <Link href="/account/orders" className={styles.viewAll}>
          View all <ArrowRight size={16} />
        </Link>
      </div>

      <div className={styles.list}>
        {orders.slice(0, 3).map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <span className={styles.orderNumber}>{order.order_number}</span>
              <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                {order.status}
              </span>
            </div>
            <div className={styles.orderDetails}>
              <div className={styles.detailItem}>
                <span className={styles.label}>Date</span>
                <span className={styles.value}>{new Date(order.placed_at).toLocaleDateString()}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Total</span>
                <span className={styles.value}>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
            {order.status === 'shipped' && (
                <div className={styles.tracking}>
                    <Truck size={14} />
                    <span>Track Shipment</span>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
