"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, CreditCard, CheckCircle } from "lucide-react";
import styles from "./page.module.css";

const STEPS = ["Shipping", "Payment", "Review"];

export default function CheckoutPage() {
    const [step, setStep] = useState(0);
    const [placed, setPlaced] = useState(false);
    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", phone: "",
        address: "", city: "", state: "", zip: "", country: "US",
        cardName: "", cardNumber: "", expiry: "", cvv: "",
    });

    const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        setPlaced(true);
    };

    if (placed) {
        return (
            <div className={styles.successPage}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}><CheckCircle size={56} /></div>
                    <h1 className={styles.successTitle}>Order Placed!</h1>
                    <p className={styles.successText}>Thank you for your purchase. You&apos;ll receive a confirmation email shortly.</p>
                    <p className={styles.orderId}>Order #AUR-{Math.floor(100000 + Math.random() * 900000)}</p>
                    <Link href="/products" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>Continue Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <Link href="/cart" className={styles.backLink}><ArrowLeft size={16} /> Back to Cart</Link>
                <h1 className={styles.title}>Checkout</h1>

                {/* Stepper */}
                <div className={styles.stepper}>
                    {STEPS.map((s, i) => (
                        <div key={s} className={styles.stepRow}>
                            <button className={`${styles.step} ${i === step ? styles.stepActive : ""} ${i < step ? styles.stepDone : ""}`} onClick={() => i < step && setStep(i)}>
                                <span className={styles.stepNum}>{i < step ? "✓" : i + 1}</span>
                                <span className={styles.stepLabel}>{s}</span>
                            </button>
                            {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ""}`} />}
                        </div>
                    ))}
                </div>

                <div className={styles.layout}>
                    <form onSubmit={step === 2 ? handlePlaceOrder : (e) => { e.preventDefault(); setStep((s) => s + 1); }} className={styles.formSection}>
                        {/* Step 0: Shipping */}
                        {step === 0 && (
                            <div className={styles.formCard}>
                                <h2 className={styles.sectionTitle}>Shipping Information</h2>
                                <div className={styles.grid2}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>First Name</label>
                                        <input type="text" className="input" value={form.firstName} onChange={set("firstName")} placeholder="John" required />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Last Name</label>
                                        <input type="text" className="input" value={form.lastName} onChange={set("lastName")} placeholder="Doe" required />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Email</label>
                                    <input type="email" className="input" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Phone</label>
                                    <input type="tel" className="input" value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Street Address</label>
                                    <input type="text" className="input" value={form.address} onChange={set("address")} placeholder="123 Main St" required />
                                </div>
                                <div className={styles.grid3}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>City</label>
                                        <input type="text" className="input" value={form.city} onChange={set("city")} placeholder="New York" required />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>State</label>
                                        <input type="text" className="input" value={form.state} onChange={set("state")} placeholder="NY" required />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>ZIP</label>
                                        <input type="text" className="input" value={form.zip} onChange={set("zip")} placeholder="10001" required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>Continue to Payment →</button>
                            </div>
                        )}

                        {/* Step 1: Payment */}
                        {step === 1 && (
                            <div className={styles.formCard}>
                                <h2 className={styles.sectionTitle}><CreditCard size={20} /> Payment Details</h2>
                                <div className={styles.secureNote}><Lock size={13} /> Your payment info is encrypted and secure</div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Name on Card</label>
                                    <input type="text" className="input" value={form.cardName} onChange={set("cardName")} placeholder="John Doe" required />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Card Number</label>
                                    <input type="text" className="input" value={form.cardNumber} onChange={set("cardNumber")} placeholder="4242 4242 4242 4242" maxLength={19} required />
                                </div>
                                <div className={styles.grid2}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Expiry</label>
                                        <input type="text" className="input" value={form.expiry} onChange={set("expiry")} placeholder="MM/YY" maxLength={5} required />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>CVV</label>
                                        <input type="text" className="input" value={form.cvv} onChange={set("cvv")} placeholder="•••" maxLength={4} required />
                                    </div>
                                </div>
                                <div className={styles.btnRow}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
                                    <button type="submit" className="btn btn-primary">Review Order →</button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Review */}
                        {step === 2 && (
                            <div className={styles.formCard}>
                                <h2 className={styles.sectionTitle}>Review & Place Order</h2>
                                <div className={styles.reviewSection}>
                                    <h3 className={styles.reviewLabel}>Shipping To</h3>
                                    <p>{form.firstName} {form.lastName}</p>
                                    <p>{form.address}, {form.city}, {form.state} {form.zip}</p>
                                    <p>{form.email}</p>
                                </div>
                                <div className={styles.reviewSection}>
                                    <h3 className={styles.reviewLabel}>Payment</h3>
                                    <p>Card ending in {form.cardNumber.slice(-4) || "****"}</p>
                                </div>
                                <div className={styles.btnRow}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                                    <button type="submit" className="btn btn-primary"><Lock size={15} /> Place Order — $567.97</button>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Mini Order Summary */}
                    <aside className={styles.miniSummary}>
                        <h3 className={styles.miniSummaryTitle}>Order Total</h3>
                        <div className={styles.miniLines}>
                            <div className={styles.miniLine}><span>Sony Headphones × 1</span><span>$398.00</span></div>
                            <div className={styles.miniLine}><span>Mechanical Keyboard × 2</span><span>$319.98</span></div>
                            <div className={styles.miniLine}><span>Shipping</span><span className={styles.freeShip}>Free</span></div>
                            <div className={styles.miniLine}><span>Tax</span><span>$57.44</span></div>
                        </div>
                        <div className={styles.miniTotal}><span>Total</span><span>$775.42</span></div>
                        <p className={styles.secureNote2}><Lock size={12} /> 256-bit SSL Encryption</p>
                    </aside>
                </div>
            </div>
        </div>
    );
}
