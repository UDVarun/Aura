"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ShieldCheck, Truck, RotateCcw, MapPin, Star, ShoppingCart } from "lucide-react";
import styles from "./page.module.css";
import { useCart } from "@/context/CartContext";
import clsx from "clsx";

type ProductDetail = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  images: string[];
};

const PRODUCT_DETAILS: ProductDetail[] = [
  {
    id: "1",
    name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    category: "Audio",
    brand: "Sony",
    price: 398,
    rating: 4.8,
    reviews: 1243,
    description: "Industry-leading active noise cancellation, premium comfort, and all-day battery life built for focused listening.",
    features: [
      "Dual-processor active noise cancellation with adaptive environmental tuning",
      "Integrated V1 chip with dynamic range optimization",
      "Clear call performance with beamforming microphones",
      "Up to 30-hour battery life with fast USB-C charging",
    ],
    images: [
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  {
    id: "2",
    name: "Minimalist Mechanical Keyboard with Custom Switches",
    category: "Tech",
    brand: "Logitech",
    price: 159.99,
    rating: 4.9,
    reviews: 876,
    description: "Precision-tuned typing feel with premium aluminum build and customizable switch profile.",
    features: [
      "Hot-swappable switch architecture",
      "CNC-machined aluminum frame",
      "Bluetooth and low-latency 2.4GHz support",
      "Custom per-key backlight profiles",
    ],
    images: [
      "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1541140532154-b024d705b90a?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  {
    id: "3",
    name: "Aura Premium Smart Home Speaker",
    category: "Audio",
    brand: "Aura",
    price: 249.5,
    rating: 4.6,
    reviews: 543,
    description: "Rich, room-filling audio in a sculpted design that complements modern interiors.",
    features: [
      "360-degree spatial audio dispersion",
      "Voice-assistant ecosystem support",
      "Multi-room synchronization",
      "Fabric and aluminum premium enclosure",
    ],
    images: [
      "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558089687-f282ffcbc0d4?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512446816042-444d641267c4?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  {
    id: "4",
    name: "Geometric Ceramic Table Lamp",
    category: "Decor",
    brand: "Aura",
    price: 89,
    rating: 4.5,
    reviews: 321,
    description: "Soft ambient glow with a geometric ceramic base designed for elegant spaces.",
    features: [
      "Hand-finished ceramic base",
      "Linen-blend shade for smooth diffusion",
      "Built-in dimmable control",
      "LED-efficient bulb compatibility",
    ],
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=1400&auto=format&fit=crop",
    ],
  },
];

function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className={styles.ratingContainer}>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={16}
            className={i <= Math.round(rating) ? styles.starFilled : styles.starEmpty}
            fill={i <= Math.round(rating) ? "currentColor" : "none"}
          />
        ))}
      </div>
      {count !== undefined && (
        <a href="#reviews" className={styles.reviewLink}>
          {count} reviews
        </a>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const product = useMemo(() => PRODUCT_DETAILS.find((p) => p.id === params.id) || PRODUCT_DETAILS[0], [params.id]);

  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addActionsRef = useRef<HTMLDivElement>(null);

  const { addItem, openCart } = useCart();

  useEffect(() => {
    if (!addActionsRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(addActionsRef.current);
    return () => observer.disconnect();
  }, []);

  const nextImage = () => setActiveImage((prev) => (prev + 1) % product.images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      category: product.category,
      quantity,
    });
    openCart();
  };

  const handleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumbs}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href="/products">Products</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.gallerySection}>
            <div className={styles.thumbnailsList}>
              {product.images.map((img, idx) => (
                <button
                  key={img}
                  className={clsx(styles.thumb, { [styles.thumbActive]: idx === activeImage })}
                  onMouseEnter={() => setActiveImage(idx)}
                  onClick={() => setActiveImage(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className={styles.thumbImage} sizes="64px" />
                </button>
              ))}
            </div>

            <div
              className={styles.galleryMain}
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onMouseMove={handleZoom}
            >
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                className={styles.mainImage}
                style={{ transform: zoomed ? "scale(1.9)" : "scale(1)", transformOrigin: zoomOrigin }}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <button className={styles.navBtnLeft} onClick={prevImage} aria-label="Previous image">
                <ChevronLeft size={22} />
              </button>
              <button className={styles.navBtnRight} onClick={nextImage} aria-label="Next image">
                <ChevronRight size={22} />
              </button>
              <span className={styles.zoomHint}>Hover to zoom</span>
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.brandLink}>{product.brand}</div>
            <h1 className={styles.title}>{product.name}</h1>
            <Stars rating={product.rating} count={product.reviews} />

            <div className={styles.priceBlock}>
              <span className={styles.priceSymbol}>$</span>
              <span className={styles.priceMain}>{product.price.toFixed(2)}</span>
            </div>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.aboutSection}>
              <h3 className={styles.aboutTitle}>Highlights</h3>
              <ul className={styles.featureList}>
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside className={styles.buyBox}>
            <div className={styles.buyBoxPrice}>${product.price.toFixed(2)}</div>
            <p className={styles.deliveryLine}>Fast insured shipping available for your location.</p>

            <div className={styles.locationLine}>
              <MapPin size={14} />
              <span>Delivering to your saved address</span>
            </div>

            <h3 className={styles.inStock}>In Stock</h3>

            <div className={styles.quantitySelector}>
              <label htmlFor="qty">Quantity</label>
              <select
                id="qty"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={styles.qtySelect}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.buyActions} ref={addActionsRef}>
              <button className={styles.addToCartBtn} onClick={handleAddToCart}>
                <ShoppingCart size={16} />
                Add to Cart
              </button>
              <button className={styles.buyNowBtn}>Buy Now</button>
            </div>

            <div className={styles.guaranteeList}>
              <div className={styles.guaranteeItem}>
                <ShieldCheck size={18} className={styles.gIcon} />
                <span>1 Year Warranty</span>
              </div>
              <div className={styles.guaranteeItem}>
                <RotateCcw size={18} className={styles.gIcon} />
                <span>30-Day Returns</span>
              </div>
              <div className={styles.guaranteeItem}>
                <Truck size={18} className={styles.gIcon} />
                <span>Tracked Delivery</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className={clsx(styles.stickyBar, { [styles.stickyBarVisible]: showStickyBar })} aria-hidden={!showStickyBar}>
        <div className={`container ${styles.stickyInner}`}>
          <div>
            <p className={styles.stickyName}>{product.name}</p>
            <p className={styles.stickyPrice}>${product.price.toFixed(2)}</p>
          </div>
          <button className={styles.stickyAddBtn} onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
