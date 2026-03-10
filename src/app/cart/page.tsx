"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Tag } from "lucide-react";
import styles from "./page.module.css";
import { useCart } from "@/context/CartContext";
import { formatCurrency, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, GST_RATE } from "@/lib/currency";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const tax = subtotal * GST_RATE;
  const total = subtotal + shipping + tax;

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/products" className={styles.backLink}>
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 className={styles.title}>
          Shopping Cart <span className={styles.itemCount}>{items.length} items</span>
        </h1>

        {items.length === 0 ? (
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Your cart is empty</h2>
            <p className={styles.securityNote}>Add premium products to continue to checkout.</p>
            <Link href="/products" className={`btn btn-primary ${styles.checkoutBtn}`}>
              <ShoppingBag size={18} /> Browse Products
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            <div className={styles.itemsSection}>
              {items.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    <Image src={item.image} alt={item.name} fill className={styles.image} sizes="120px" />
                  </div>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemCategory}>{item.category}</span>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <div className={styles.itemActions}>
                      <div className={styles.qtyControl}>
                        <button className={styles.qtyBtn} aria-label="Decrease quantity" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus size={14} />
                        </button>
                        <span className={styles.qty}>{item.quantity}</span>
                        <button className={styles.qtyBtn} aria-label="Increase quantity" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <button className={styles.removeBtn} aria-label="Remove item" onClick={() => removeItem(item.id)}>
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  </div>
                  <div className={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <aside className={styles.summary}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              <div className={styles.promo}>
                <div className={styles.promoInput}>
                  <Tag size={15} className={styles.promoIcon} />
                  <input type="text" placeholder="Promo code" className={`input ${styles.promoField}`} />
                </div>
                <button className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                  Apply
                </button>
              </div>

              <div className={styles.summaryLines}>
                <div className={styles.summaryLine}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className={styles.freeShip}>Free</span> : formatCurrency(shipping)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Tax (GST {GST_RATE * 100}%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                {subtotal < FREE_SHIPPING_THRESHOLD && subtotal > 0 && (
                  <div className={styles.shippingNote}>
                    Add {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping!
                  </div>
                )}
              </div>

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <Link href="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`}>
                <ShoppingBag size={18} /> Proceed to Checkout
              </Link>

              <div className={styles.securityNote}>
                Secure checkout powered by SSL encryption and INR-only pricing
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
