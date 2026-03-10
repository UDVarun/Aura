"use client";

import { useCart } from "@/context/CartContext";
import styles from "./CartDrawer.module.css";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import clsx from "clsx";
import { formatCurrency, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, GST_RATE } from "@/lib/currency";

export default function CartDrawer() {
    const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close drawer when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                closeCart();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            // Prevent scrolling on body when drawer is open
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "";
        };
    }, [isOpen, closeCart]);

    if (!isOpen) return null;

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
    const tax = subtotal * GST_RATE;
    const total = subtotal + shipping + tax;

    return (
        <>
            <div className={styles.overlay} aria-hidden="true" />
            <div className={styles.drawer} ref={drawerRef} role="dialog" aria-modal="true" aria-label="Shopping Cart">
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Cart <span className={styles.count}>({items.length})</span>
                    </h2>
                    <button className={styles.closeBtn} onClick={closeCart} aria-label="Close cart">
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <ShoppingBag size={48} className={styles.emptyIcon} />
                            <p className={styles.emptyText}>Your cart is empty.</p>
                            <button className="btn btn-primary" onClick={closeCart}>
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className={styles.itemsList}>
                            {items.map((item) => (
                                <div key={item.id} className={styles.cartItem}>
                                    <div className={styles.itemImageWrap}>
                                        <Image src={item.image} alt={item.name} fill className={styles.itemImage} sizes="80px" />
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <h3 className={styles.itemName}>{item.name}</h3>
                                        <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>

                                        <div className={styles.itemActions}>
                                            <div className={styles.qtyControl}>
                                                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                                    <Minus size={12} />
                                                </button>
                                                <span className={styles.qty}>{item.quantity}</span>
                                                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.itemTotal}>
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className={styles.footer}>
                        <div className={styles.subtotalRow}>
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <p className={styles.shippingNote}>
                            {subtotal >= FREE_SHIPPING_THRESHOLD
                                ? "You qualify for free shipping!"
                                : `Add ${formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping`}
                        </p>
                        <div className={styles.actions}>
                            <button className={clsx("btn btn-secondary", styles.actionBtn)} onClick={closeCart}>
                                Continue Shopping
                            </button>
                            <Link href="/checkout" className={clsx("btn btn-primary", styles.actionBtn)} onClick={closeCart}>
                                Checkout - {formatCurrency(total)}
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
