"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import styles from "../products/page.module.css";
import { createClient } from "@/lib/supabase/client";

interface CategoryRow {
    id: string;
    name: string;
    slug?: string | null;
    created_at?: string;
}

function getErrorMessage(err: unknown) {
    if (err instanceof Error) return err.message;
    return String(err);
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
    const supabase = createClient();
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editSlug, setEditSlug] = useState("");

    useEffect(() => {
        async function fetchCategories() {
            try {
                const { data, error } = await supabase
                    .from("categories")
                    .select("id, name, slug, created_at")
                    .order("name");

                if (error) throw error;
                setCategories(data ?? []);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        }

        fetchCategories();
    }, [supabase]);

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return;

        try {
            setSubmitting(true);
            setError(null);
            const payload = { name: name.trim(), slug: slugify(name) };
            const { data, error } = await supabase
                .from("categories")
                .insert(payload)
                .select("id, name, slug, created_at")
                .single();

            if (error) throw error;
            setCategories((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
            setName("");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category?")) return;

        try {
            setError(null);
            const { error } = await supabase.from("categories").delete().eq("id", id);
            if (error) throw error;
            setCategories((current) => current.filter((category) => category.id !== id));
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const startEdit = (category: CategoryRow) => {
        setEditingId(category.id);
        setEditName(category.name);
        setEditSlug(category.slug ?? slugify(category.name));
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditSlug("");
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;

        try {
            setSubmitting(true);
            setError(null);
            const payload = {
                name: editName.trim(),
                slug: slugify(editSlug || editName),
            };
            const { data, error } = await supabase
                .from("categories")
                .update(payload)
                .eq("id", id)
                .select("id, name, slug, created_at")
                .single();

            if (error) throw error;
            setCategories((current) =>
                current.map((category) => (category.id === id ? data : category)).sort((a, b) => a.name.localeCompare(b.name))
            );
            cancelEdit();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Categories</h1>
                    <p className={styles.pageSubtitle}>Manage the exact categories used by vendor product forms and the storefront product filters.</p>
                </div>
            </div>

            <div className={styles.toolbar}>
                <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Add new category"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ maxWidth: "24rem" }}
                    />
                    <button className="btn btn-primary" type="submit" disabled={submitting}>
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                        Add Category
                    </button>
                </form>
            </div>

            {error && (
                <div className={styles.errorState}>
                    <p>Error: {error}</p>
                </div>
            )}

            {loading ? (
                <div className={styles.loadingState}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading categories...</p>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Slug</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id} className={styles.tableRow}>
                                        <td>
                                            {editingId === category.id ? (
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                />
                                            ) : (
                                                category.name
                                            )}
                                        </td>
                                        <td>
                                            {editingId === category.id ? (
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={editSlug}
                                                    onChange={(e) => setEditSlug(e.target.value)}
                                                />
                                            ) : (
                                                category.slug || "-"
                                            )}
                                        </td>
                                        <td>
                                            {editingId === category.id ? (
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => handleUpdate(category.id)}
                                                        aria-label="Save category"
                                                        disabled={submitting}
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={cancelEdit}
                                                        aria-label="Cancel edit"
                                                        type="button"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => startEdit(category)}
                                                        aria-label="Edit category"
                                                        type="button"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        onClick={() => handleDelete(category.id)}
                                                        aria-label="Delete category"
                                                        type="button"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className={styles.emptyCell}>No categories found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
