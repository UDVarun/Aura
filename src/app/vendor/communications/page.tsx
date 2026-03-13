"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SupportWorkspace } from "@/components/marketplace/SupportWorkspace";
import { useAuth } from "@/context/AuthContext";
import { useVendor } from "@/context/VendorContext";
import { Stars } from "@/components/marketplace/Stars";
import styles from "./page.module.css";

type QuestionRow = {
    id: string;
    question: string;
    answer: string | null;
    status: string;
    created_at: string;
    products?: { title?: string | null } | null;
};

export default function VendorCommunicationsPage() {
    const supabase = createClient();
    const { user, isLoading } = useAuth();
    const { reviews: vendorReviews } = useVendor();
    const [questions, setQuestions] = useState<QuestionRow[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (isLoading || !user) return;
        const vendorId = user.id;

        let active = true;

        async function loadQuestions() {
            const { data } = await supabase
                .from("product_questions")
                .select("id, question, answer, status, created_at, products(title)")
                .eq("vendor_id", vendorId)
                .order("created_at", { ascending: false })
                .limit(8);

            if (!active) return;
            setQuestions((data as QuestionRow[]) ?? []);
        }

        loadQuestions();
        return () => {
            active = false;
        };
    }, [isLoading, supabase, user]);

    const submitAnswer = async (questionId: string) => {
        const answer = answers[questionId]?.trim();
        if (!answer) return;

        setFeedback("");
        const response = await fetch(`/api/product-questions/${questionId}/answer`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer }),
        });
        const payload = await response.json();

        if (!response.ok) {
            setFeedback(payload.error || "Unable to send answer.");
            return;
        }

        setQuestions((prev) => prev.map((item) => (item.id === questionId ? { ...item, ...payload.question } : item)));
        setAnswers((prev) => ({ ...prev, [questionId]: "" }));
        setFeedback("Seller response published.");
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Communications</h1>
                    <p className={styles.pageSubtitle}>
                        Manage pre-sale buyer questions and post-purchase support cases from one operational workspace.
                    </p>
                </div>
            </div>

            <section>
                <div className={styles.pageHeader}>
                    <div>
                        <h2 className={styles.pageTitle} style={{ fontSize: "1.55rem" }}>Product questions</h2>
                        <p className={styles.pageSubtitle}>Respond quickly to improve trust and conversion on your listings.</p>
                    </div>
                </div>

                <div className={styles.questionGrid}>
                    {questions.length === 0 && (
                        <article className={styles.questionCard}>No buyer questions yet.</article>
                    )}
                    {questions.map((question) => (
                        <article key={question.id} className={styles.questionCard}>
                            <div className={styles.questionMeta}>
                                <span>{question.products?.title ?? "Product question"}</span>
                                <span>{new Date(question.created_at).toLocaleDateString("en-IN")}</span>
                            </div>
                            <div>{question.question}</div>
                            {question.answer ? (
                                <div>
                                    <strong>Current answer</strong>
                                    <p>{question.answer}</p>
                                </div>
                            ) : (
                                <span className={`badge badge-yellow`}>Awaiting response</span>
                            )}
                            <div className={styles.answerForm}>
                                <textarea
                                    className="input"
                                    rows={4}
                                    value={answers[question.id] ?? question.answer ?? ""}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                    placeholder="Write a precise, policy-safe seller response."
                                />
                                <button type="button" className="btn btn-primary" onClick={() => submitAnswer(question.id)}>
                                    {question.answer ? "Update Answer" : "Publish Answer"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
                {feedback && <p className={styles.feedback}>{feedback}</p>}
            </section>

            <SupportWorkspace
                role="vendor"
                title="Support cases assigned to your store"
                subtitle="Resolve order issues, reply with evidence, and keep the customer updated inside Aura."
            />

            <section style={{ marginTop: "3rem" }}>
                <div className={styles.pageHeader}>
                    <div>
                        <h2 className={styles.pageTitle} style={{ fontSize: "1.55rem" }}>Customer reviews</h2>
                        <p className={styles.pageSubtitle}>Monitor feedback across your catalog and identify areas for improvement.</p>
                    </div>
                </div>

                <div className={styles.questionGrid}>
                    {vendorReviews.length === 0 && (
                        <article className={styles.questionCard}>No customer reviews yet.</article>
                    )}
                    {vendorReviews.map((review) => (
                        <article key={review.id} className={styles.questionCard}>
                            <div className={styles.questionMeta}>
                                <strong>{review.products?.title ?? "Product review"}</strong>
                                <span>{new Date(review.created_at).toLocaleDateString("en-IN")}</span>
                            </div>
                            <div style={{ margin: "0.5rem 0" }}>
                                <Stars rating={review.rating} showCount={false} size={14} />
                            </div>
                            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{review.title}</div>
                            <div style={{ fontSize: "0.9rem", color: "var(--muted-light)" }}>{review.body}</div>
                            <div className={styles.questionMeta} style={{ marginTop: "1rem", borderTop: "1px solid var(--panel-border)", paddingTop: "0.75rem" }}>
                                <span style={{ fontSize: "0.75rem" }}>Reviewed by: {review.profiles?.email}</span>
                                {review.is_verified && <span className="badge badge-green">Verified Purchase</span>}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
