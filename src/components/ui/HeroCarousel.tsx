"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./HeroCarousel.module.css";
import clsx from "clsx";

export interface Banner {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    linkText: string;
    linkHref: string;
}

interface HeroCarouselProps {
    banners: Banner[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const next = () => setCurrent((c) => (c + 1) % banners.length);
    const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

    if (!banners.length) return null;

    return (
        <div className={styles.carouselContainer}>
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={clsx(styles.slide, { [styles.active]: index === current })}
                >
                    <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        priority={index === 0}
                        className={styles.backgroundImage}
                    />
                    <div className={styles.overlay} />
                    <div className={styles.content}>
                        <h1 className={styles.title}>{banner.title}</h1>
                        <p className={styles.subtitle}>{banner.subtitle}</p>
                        <Link href={banner.linkHref} className={styles.ctaButton}>
                            {banner.linkText}
                        </Link>
                    </div>
                </div>
            ))}

            <button className={clsx(styles.navButton, styles.prev)} onClick={prev} aria-label="Previous slide">
                <ChevronLeft size={24} />
            </button>
            <button className={clsx(styles.navButton, styles.next)} onClick={next} aria-label="Next slide">
                <ChevronRight size={24} />
            </button>

            <div className={styles.indicators}>
                {banners.map((_, index) => (
                    <button
                        key={index}
                        className={clsx(styles.dot, { [styles.dotActive]: index === current })}
                        onClick={() => setCurrent(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
