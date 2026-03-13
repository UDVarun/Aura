import type { Metadata } from "next";
import styles from "./page.module.css";
import { HeroSection } from "@/components/about/HeroSection";
import { MissionVision } from "@/components/about/MissionVision";
import { PlatformOverview } from "@/components/about/PlatformOverview";
import { TechStackGrid } from "@/components/about/TechStackGrid";
import { FeatureGrid } from "@/components/about/FeatureGrid";
import { TrustSecurity } from "@/components/about/TrustSecurity";
import { FounderProfile } from "@/components/about/FounderProfile";
import { FutureVision } from "@/components/about/FutureVision";

export const metadata: Metadata = {
    title: "About Aura",
    description:
        "Learn how Aura connects customers, vendors, and operators through a premium marketplace platform built for modern commerce.",
};

export default function AboutPage() {
    return (
        <main className={styles.page}>
            <HeroSection />
            <MissionVision />
            <PlatformOverview />
            <TechStackGrid />
            <FeatureGrid />
            <TrustSecurity />
            <FounderProfile />
            <FutureVision />
        </main>
    );
}
