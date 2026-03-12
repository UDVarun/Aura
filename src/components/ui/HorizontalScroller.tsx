"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./HorizontalScroller.module.css";

interface HorizontalScrollerProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

export function HorizontalScroller({ title, subtitle, children }: HorizontalScrollerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        const container = scrollRef.current;
        if (!container) return;

        const firstCard = container.firstElementChild as HTMLElement | null;
        const cardWidth = firstCard?.getBoundingClientRect().width ?? container.clientWidth;
        const gap = Number.parseFloat(getComputedStyle(container).columnGap || getComputedStyle(container).gap || "0");
        const offset = cardWidth + gap;

        container.scrollBy({
            left: direction === "left" ? -offset : offset,
            behavior: "smooth",
        });
    };

    return (
        <section className={styles.section}>
            <div className={`container ${styles.header}`}>
                <div className={styles.headerTexts}>
                    <h2 className={styles.title}>{title}</h2>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
                <div className={styles.controls}>
                    <button className={styles.scrollBtn} onClick={() => scroll("left")} aria-label="Scroll left">
                        <ChevronLeft size={20} />
                    </button>
                    <button className={styles.scrollBtn} onClick={() => scroll("right")} aria-label="Scroll right">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            <div className={`container ${styles.scrollWrapper}`}>
                <div className={styles.scrollContainer} ref={scrollRef}>
                    {children}
                </div>
            </div>
        </section>
    );
}
