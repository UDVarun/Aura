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

    const scroll = (offset: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
        }
    };

    return (
        <section className={styles.section}>
            <div className={`container ${styles.header}`}>
                <div className={styles.headerTexts}>
                    <h2 className={styles.title}>{title}</h2>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
                <div className={styles.controls}>
                    <button className={styles.scrollBtn} onClick={() => scroll(-600)} aria-label="Scroll left">
                        <ChevronLeft size={20} />
                    </button>
                    <button className={styles.scrollBtn} onClick={() => scroll(600)} aria-label="Scroll right">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            <div className={styles.scrollWrapper}>
                <div className={styles.scrollContainer} ref={scrollRef}>
                    {children}
                </div>
            </div>
        </section>
    );
}
