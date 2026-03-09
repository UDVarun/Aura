"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./ProductForm.module.css";

interface ProductFormProps {
    backPath: string;
    onSuccessPath: string;
}

export default function ProductForm({ backPath, onSuccessPath }: ProductFormProps) {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        stock: "",
        categoryId: "",
        isFeatured: false,
    });

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from("categories").select("id, name");
            if (data) setCategories(data);
        };
        fetchCategories();
    }, [supabase]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const removeImage = () => {
        setFile(null);
        setPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let imageUrl = "";

            if (file) {
                setUploading(true);
                const formData = new FormData();
                formData.append("file", file);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
                imageUrl = uploadData.url;
                setUploading(false);
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error: dbError } = await supabase.from("products").insert({
                title: form.title,
                description: form.description,
                price: parseFloat(form.price),
                stock_quantity: parseInt(form.stock),
                category_id: form.categoryId || null,
                image_url: imageUrl,
                vendor_id: user.id,
                is_featured: form.isFeatured,
            });

            if (dbError) throw dbError;

            setSuccess(true);
            setTimeout(() => {
                router.push(onSuccessPath);
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href={backPath} className={styles.backBtn}>
                    <ArrowLeft size={18} /> Back
                </Link>
                <h1 className={styles.title}>Add New Product</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.grid}>
                    <div className={styles.mainCol}>
                        <div className={styles.card}>
                            <div className={styles.field}>
                                <label className={styles.label}>Product Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Sony WH-1000XM5"
                                    required
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Description</label>
                                <textarea
                                    className="input"
                                    rows={5}
                                    placeholder="Tell customers about your product..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Inventory & Pricing</h2>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input"
                                        placeholder="0.00"
                                        required
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Stock Quantity</label>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="0"
                                        required
                                        value={form.stock}
                                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sideCol}>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Product Image</h2>
                            <div className={styles.imageUpload}>
                                {preview ? (
                                    <div className={styles.previewContainer}>
                                        <img src={preview} alt="Preview" className={styles.previewImg} />
                                        <button type="button" onClick={removeImage} className={styles.removeBtn}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className={styles.uploadPlaceholder}>
                                        <Upload size={32} />
                                        <span>Click to upload image</span>
                                        <input
                                            type="file"
                                            className={styles.hiddenInput}
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className={styles.helpText}>Supported formats: JPG, PNG, WebP. Max 5MB.</p>
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Organization</h2>
                            <div className={styles.field}>
                                <label className={styles.label}>Category</label>
                                <select
                                    className="input"
                                    value={form.categoryId}
                                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.checkboxField}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={form.isFeatured}
                                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                                    />
                                    Mark as Featured Product
                                </label>
                            </div>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.success}><CheckCircle size={16} /> Product created successfully!</div>}

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin" size={18} /> {uploading ? "Uploading Image..." : "Saving..."}</>
                            ) : "Publish Product"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
