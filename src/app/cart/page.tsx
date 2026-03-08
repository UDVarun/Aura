"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Tag } from "lucide-react";
import styles from "./page.module.css";

const CART_ITEMS = [
    { id: "1", name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones", price: 398.00, quantity: 1, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=400&auto=format&fit=crop", category: "Electronics" },
    { id: "2", name: "Minimalist Mechanical Keyboard", price: 159.99, quantity: 2, image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop", category: "Accessories" },
];

const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
const shipping = subtotal > 500 ? 0 : 9.99;
const tax = subtotal * 0.08;
const total = subtotal + shipping + tax;

export default function CartPage() {
    return (
        <div className={styles.page}>
            <div className="container">
                <Link href="/products" className={styles.backLink}>
                    <ArrowLeft size={16} /> Continue Shopping
                </Link>

                <h1 className={styles.title}>Shopping Cart <span className={styles.itemCount}>{CART_ITEMS.length} items</span></h1>

                <div className={styles.layout}>
                    {/* Cart Items */}
                    <div className={styles.itemsSection}>
                        {CART_ITEMS.map((item) => (
                            <div key={item.id} className={styles.cartItem}>
                                <div className={styles.itemImage}>
                                    <Image src={item.image} alt={item.name} fill className={styles.image} sizes="120px" />
                                </div>
                                <div className={styles.itemDetails}>
                                    <span className={styles.itemCategory}>{item.category}</span>
                                    <h3 className={styles.itemName}>{item.name}</h3>
                                    <div className={styles.itemActions}>
                                        <div className={styles.qtyControl}>
                                            <button className={styles.qtyBtn} aria-label="Decrease quantity"><Minus size={14} /></button>
                                            <span className={styles.qty}>{item.quantity}</span>
                                            <button className={styles.qtyBtn} aria-label="Increase quantity"><Plus size={14} /></button>
                                        </div>
                                        <button className={styles.removeBtn} aria-label="Remove item">
                                            <Trash2 size={15} /> Remove
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.itemPrice}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <aside className={styles.summary}>
                        <h2 className={styles.summaryTitle}>Order Summary</h2>

                        <div className={styles.promo}>
                            <div className={styles.promoInput}>
                                <Tag size={15} className={styles.promoIcon} />
                                <input type="text" placeholder="Promo code" className={`input ${styles.promoField}`} />
                            </div>
                            <button className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>Apply</button>
                        </div>

                        <div className={styles.summaryLines}>
                            <div className={styles.summaryLine}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className={styles.summaryLine}>
                                <span>Shipping</span>
                                <span>{shipping === 0 ? <span className={styles.freeShip}>Free</span> : `$${shipping.toFixed(2)}`}</span>
                            </div>
                            <div className={styles.summaryLine}><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                            {subtotal <= 500 && (
                                <div className={styles.shippingNote}>
                                    Add ${(500 - subtotal).toFixed(2)} more for free shipping!
                                </div>
                            )}
                        </div>

                        <div className={styles.summaryTotal}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>

                        <Link href="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`}>
                            <ShoppingBag size={18} /> Proceed to Checkout
                        </Link>

                        <div className={styles.securityNote}>
                            🔒 Secure checkout powered by SSL encryption
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
