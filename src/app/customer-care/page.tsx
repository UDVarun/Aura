import Link from "next/link";
import { Mail, PhoneCall, MessageCircle, MapPin, Clock3 } from "lucide-react";
import styles from "./page.module.css";

const PILLARS = [
  {
    title: "Order Confidence",
    desc: "Track updates, delivery milestones, and fulfillment status with complete visibility.",
  },
  {
    title: "Transparent Policies",
    desc: "Clear shipping, returns, and refund standards designed to reduce uncertainty.",
  },
  {
    title: "Priority Assistance",
    desc: "Specialist support for product guidance, exchanges, and post-purchase issues.",
  },
];

const CONTACT_CHANNELS = [
  {
    title: "Customer Support",
    detail: "help@aura.com",
    hint: "Response time: under 6 hours",
    Icon: Mail,
  },
  {
    title: "Phone Support",
    detail: "+1 (800) 555-0199",
    hint: "Mon-Fri, 9:00 AM-7:00 PM",
    Icon: PhoneCall,
  },
  {
    title: "Live Chat",
    detail: "Start instant chat",
    hint: "Available for all account holders",
    Icon: MessageCircle,
  },
];

export default function CustomerCarePage() {
  return (
    <main className={styles.page}>
      <section className={`container ${styles.hero}`}>
        <p className={styles.eyebrow}>Customer Care</p>
        <h1 className={styles.title}>Professional support, designed around customer trust.</h1>
        <p className={styles.subtitle}>
          Aura Customer Care unifies order help, policy guidance, and direct support channels in one place for a seamless post-purchase experience.
        </p>
        <div className={styles.actions}>
          <Link href="/products" className={styles.primaryAction}>Start Shopping</Link>
        </div>
      </section>

      <section className={`container ${styles.pillars}`}>
        <h2 className={styles.sectionTitle}>What You Can Expect</h2>
        <div className={styles.grid}>
          {PILLARS.map((item) => (
            <article key={item.title} className={styles.card}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`container ${styles.channels}`}>
        <h2 className={styles.sectionTitle}>Support Channels</h2>
        <div className={styles.channelsGrid}>
          {CONTACT_CHANNELS.map(({ title, detail, hint, Icon }) => (
            <article key={title} className={styles.channelCard}>
              <div className={styles.channelIcon}>
                <Icon size={18} />
              </div>
              <h3 className={styles.channelTitle}>{title}</h3>
              <p className={styles.channelDetail}>{detail}</p>
              <p className={styles.channelHint}>{hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`container ${styles.mainSection}`}>
        <div className={styles.mainGrid}>
          <div className={styles.formCard}>
            <h2>Send a Request</h2>
            <p className={styles.formHint}>Share your issue and our team will follow up with a clear next step.</p>
            <form className={styles.form}>
              <div className={styles.formRow}>
                <input className="input" type="text" placeholder="Full name" required />
                <input className="input" type="email" placeholder="Email address" required />
              </div>
              <div className={styles.formRow}>
                <input className="input" type="text" placeholder="Order ID (optional)" />
                <select className="input" defaultValue="support">
                  <option value="support">Support</option>
                  <option value="returns">Returns</option>
                  <option value="shipping">Shipping</option>
                  <option value="account">Account</option>
                </select>
              </div>
              <textarea className={`input ${styles.textarea}`} placeholder="How can we help?" required />
              <button type="submit" className="btn btn-primary">Submit Request</button>
            </form>
          </div>

          <aside className={styles.infoCard}>
            <h3>Customer Care Desk</h3>
            <ul className={styles.infoList}>
              <li><MapPin size={16} />220 Mission Street, San Francisco, CA</li>
              <li><Clock3 size={16} />Mon-Fri, 9:00 AM-7:00 PM (PST)</li>
              <li><Mail size={16} />help@aura.com</li>
            </ul>
            <div className={styles.quickLinks}>
              <Link href="/faq">FAQ</Link>
              <Link href="/shipping">Shipping and Returns</Link>
              <Link href="/account">Manage Account</Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
