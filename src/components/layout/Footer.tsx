import Link from "next/link";
import styles from "./Footer.module.css";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.footerContent}`}>
                <div className={styles.footerSection}>
                    <h3 className={styles.brandName}>Aura</h3>
                    <p className={styles.description}>
                        A premium commerce experience with curated technology and living essentials for modern professionals.
                    </p>
                    <div className={styles.socialLinks}>
                        <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                        <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                        <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                        <a href="#" aria-label="YouTube"><Youtube size={20} /></a>
                    </div>
                </div>

                <div className={styles.footerSection}>
                    <h4 className={styles.sectionTitle}>Shop</h4>
                    <ul className={styles.linkList}>
                        <li><Link href="/products">All Products</Link></li>
                        <li><Link href="/products?category=tech">Electronics</Link></li>
                        <li><Link href="/products?category=fashion">Fashion</Link></li>
                        <li><Link href="/products?category=home">Home & Living</Link></li>
                    </ul>
                </div>

                <div className={styles.footerSection}>
                    <h4 className={styles.sectionTitle}>Support</h4>
                    <ul className={styles.linkList}>
                        <li><Link href="/customer-care">Customer Care</Link></li>
                        <li><Link href="/faq">FAQ</Link></li>
                        <li><Link href="/shipping">Shipping & Returns</Link></li>
                        <li><Link href="/track">Track Order</Link></li>
                    </ul>
                </div>

                <div className={styles.footerSection}>
                    <h4 className={styles.sectionTitle}>Journal</h4>
                    <p className={styles.newsletterDesc}>Get product drops, design notes, and curated recommendations from Aura.</p>
                    <form className={styles.newsletterForm}>
                        <input type="email" placeholder="Work email" required className={styles.input} />
                        <button type="submit" className={styles.button}>Join</button>
                    </form>
                </div>
            </div>
            <div className={styles.footerBottom}>
                <div className={`container ${styles.bottomContent}`}>
                    <p>&copy; {new Date().getFullYear()} Aura E-Commerce. All rights reserved.</p>
                    <div className={styles.legalLinks}>
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
