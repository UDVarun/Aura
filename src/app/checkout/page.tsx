"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, CreditCard, CheckCircle } from "lucide-react";
import styles from "./page.module.css";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  formatCurrency,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  GST_RATE,
} from "@/lib/currency";

const STEPS = ["Shipping", "Payment", "Review"];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    upiId: "",
  });
  const [paymentMode, setPaymentMode] = useState<"upi" | "card">("upi");

  const { user } = useAuth();
  const supabase = createClient();

  // Load user profile data to pre-fill checkout
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      queueMicrotask(() => {
        setForm((f) => ({ ...f, email: user.email || "" }));
      });

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setForm((f) => ({
          ...f,
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          country: data.country || "India",
          upiId: data.upi_id || f.upiId,
        }));
      }
    };

    loadProfile();
  }, [user, supabase]);

  const set =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const tax = subtotal * GST_RATE;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod: paymentMode,
          shippingAmount: shipping,
          taxAmount: tax,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to place order.");
      }

      setOrderId(payload.orderNumber || payload.orderId);
      setPlaced(true);
      await clearCart();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle size={56} />
          </div>
          <h1 className={styles.successTitle}>Order Placed!</h1>
          <p className={styles.successText}>Thank you for your purchase. You will receive a confirmation email shortly.</p>
          <p className={styles.orderId}>Order #{orderId}</p>
          <Link href="/products" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/cart" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.stepper}>
          {STEPS.map((s, i) => (
            <div key={s} className={styles.stepRow}>
              <button
                className={`${styles.step} ${i === step ? styles.stepActive : ""} ${i < step ? styles.stepDone : ""}`}
                onClick={() => i < step && setStep(i)}
              >
                <span className={styles.stepNum}>{i < step ? "OK" : i + 1}</span>
                <span className={styles.stepLabel}>{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ""}`} />}
            </div>
          ))}
        </div>

        <div className={styles.layout}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (step === 2) {
                await handlePlaceOrder(e);
              } else if (step === 0 && user) {
                // Persist shipping information securely to user profile on advance
                await supabase.from("user_profiles").upsert({
                  user_id: user.id,
                  first_name: form.firstName,
                  last_name: form.lastName,
                  phone: form.phone,
                  address: form.address,
                  city: form.city,
                  state: form.state,
                  zip: form.zip,
                  country: form.country,
                  updated_at: new Date().toISOString()
                });
                setStep((s) => s + 1);
              } else {
                setStep((s) => s + 1);
              }
            }}
            className={styles.formSection}
          >
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
                <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>Continue to Payment</button>
              </div>
            )}

            {step === 1 && (
              <div className={styles.formCard}>
                <h2 className={styles.sectionTitle}>
                  <CreditCard size={20} /> Payment Details
                </h2>
                <div
                  className={styles.paymentModes}
                  role="group"
                  aria-label="Choose payment method"
                >
                  <button
                    type="button"
                    className={`${styles.paymentModeBtn} ${paymentMode === "upi" ? styles.paymentModeActive : ""}`}
                    onClick={() => setPaymentMode("upi")}
                  >
                    UPI / NetBanking
                  </button>
                  <button
                    type="button"
                    className={`${styles.paymentModeBtn} ${paymentMode === "card" ? styles.paymentModeActive : ""}`}
                    onClick={() => setPaymentMode("card")}
                  >
                    Credit / Debit Card
                  </button>
                </div>
                <div className={styles.secureNote}>
                  <Lock size={13} /> Your payment info is encrypted and secure
                </div>
                {paymentMode === "upi" ? (
                  <div className={styles.field}>
                    <label className={styles.label}>UPI ID / Virtual Payment Address</label>
                    <input
                      type="text"
                      className="input"
                      value={form.upiId}
                      onChange={set("upiId")}
                      placeholder="you@okaxis"
                      required
                    />
                    <p className={styles.helpText}>
                      We accept UPI, net banking, Paytm, and other Indian wallets.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={styles.field}>
                      <label className={styles.label}>Name on Card</label>
                      <input
                        type="text"
                        className="input"
                        value={form.cardName}
                        onChange={set("cardName")}
                        placeholder="Anaya Singh"
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Card Number</label>
                      <input
                        type="text"
                        className="input"
                        value={form.cardNumber}
                        onChange={set("cardNumber")}
                        placeholder="4111 1111 1111 1111"
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label className={styles.label}>Expiry</label>
                        <input
                          type="text"
                          className="input"
                          value={form.expiry}
                          onChange={set("expiry")}
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>CVV</label>
                        <input
                          type="text"
                          className="input"
                          value={form.cvv}
                          onChange={set("cvv")}
                          placeholder="***"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className={styles.btnRow}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Review and Place Order</h2>
                <div className={styles.reviewSection}>
                  <h3 className={styles.reviewLabel}>Shipping To</h3>
                  <p>{form.firstName} {form.lastName}</p>
                  <p>{form.address}, {form.city}, {form.state} {form.zip}</p>
                  <p>{form.email}</p>
                </div>
                <div className={styles.reviewSection}>
                  <h3 className={styles.reviewLabel}>Payment</h3>
                  <p>
                    {paymentMode === "upi"
                      ? `UPI ID ${form.upiId || "—"}`
                      : `Card ending in ${form.cardNumber.slice(-4) || "****"}`}
                  </p>
                </div>
                {submitError && (
                  <div className={styles.secureNote} role="alert">
                    {submitError}
                  </div>
                )}
                <div className={styles.btnRow}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Lock size={15} /> {submitting ? "Processing..." : `Place Order - ${formatCurrency(total)}`}
                  </button>
                </div>
              </div>
            )}
          </form>

          <aside className={styles.miniSummary}>
            <h3 className={styles.miniSummaryTitle}>Order Total</h3>
            <div className={styles.miniLines}>
              {items.length === 0 ? (
                <div className={styles.miniLine}>
                  <span>No items in cart</span>
                  <span>{formatCurrency(0)}</span>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={styles.miniLine}>
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))
              )}
              <div className={styles.miniLine}>
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className={styles.freeShip}>Free</span> : formatCurrency(shipping)}</span>
              </div>
              <div className={styles.miniLine}>
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            </div>
            <div className={styles.miniTotal}>
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className={styles.secureNote2}><Lock size={12} /> 256-bit SSL Encryption</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
