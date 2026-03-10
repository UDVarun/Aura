"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import styles from "./ProductForm.module.css";

function getErrorMessage(err: unknown) {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;

    if (err && typeof err === "object") {
        const errorObject = err as Record<string, unknown>;
        const parts = [
            typeof errorObject.message === "string" ? errorObject.message : null,
            typeof errorObject.details === "string" ? errorObject.details : null,
            typeof errorObject.hint === "string" ? errorObject.hint : null,
            typeof errorObject.code === "string" ? `Code: ${errorObject.code}` : null,
        ].filter(Boolean);

        if (parts.length > 0) return parts.join(" | ");

        try {
            return JSON.stringify(err);
        } catch {
            return "Unknown error";
        }
    }

    return String(err);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error(message)), ms);
        }),
    ]);
}

interface ProductFormProps {
    backPath: string;
    onSuccessPath: string;
    productId?: string;
}

export default function ProductForm({ backPath, onSuccessPath, productId }: ProductFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const isEditing = Boolean(productId);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [initializing, setInitializing] = useState(isEditing);
    const [initialError, setInitialError] = useState<string | null>(null);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [vendorId, setVendorId] = useState<string | null>(null);
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

    const headline = isEditing ? "Edit Product" : "Add New Product";

    useEffect(() => {
        const fetchCategories = async () => {
            setCategoriesError(null);
            const { data, error } = await supabase.from("categories").select("id, name").order("name");
            if (error) {
                setCategoriesError(getErrorMessage(error));
                setCategories([]);
                return;
            }

            setCategories(data ?? []);
            setCategoriesError(null);
        };
        fetchCategories();
    }, [supabase]);

    useEffect(() => {
        if (!productId) return;
        let active = true;

        const loadProduct = async () => {
            setInitializing(true);
            setInitialError(null);

            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("title, description, price, stock_quantity, category_id, is_featured, image_url, vendor_id")
                    .eq("id", productId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Product not found");

                if (!active) return;
                setForm({
                    title: data.title ?? "",
                    description: data.description ?? "",
                    price: data.price != null ? data.price.toString() : "",
                    stock: data.stock_quantity != null ? data.stock_quantity.toString() : "",
                    categoryId: data.category_id ?? "",
                    isFeatured: Boolean(data.is_featured),
                });
                setExistingImageUrl(data.image_url ?? null);
                setPreview(data.image_url ?? null);
                setVendorId(data.vendor_id ?? null);
                setImageRemoved(false);
            } catch (err) {
                if (active) setInitialError(getErrorMessage(err) || "Failed to load product");
            } finally {
                if (active) setInitializing(false);
            }
        };

        loadProduct();

        return () => {
            active = false;
        };
    }, [productId, supabase]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setExistingImageUrl(null);
            setImageRemoved(false);
        }
    };

    const removeImage = () => {
        setFile(null);
        setPreview(null);
        setExistingImageUrl(null);
        setImageRemoved(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let imageUrl = existingImageUrl;

            if (file) {
                try {
                    setUploading(true);
                    const formData = new FormData();
                    formData.append("file", file);

                    const uploadData = await withTimeout(
                        fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                        }).then(async (response) => ({
                            ok: response.ok,
                            data: await response.json(),
                        })),
                        30000,
                        "Image upload timed out. Please try again."
                    );
                    if (!uploadData.ok) throw new Error(uploadData.data.error || "Upload failed");
                    imageUrl = uploadData.data.url;
                    setExistingImageUrl(imageUrl);
                    setPreview(imageUrl);
                    setImageRemoved(false);
                } finally {
                    setUploading(false);
                }
            } else if (imageRemoved) {
                imageUrl = null;
            }

            const payload = {
                title: form.title,
                description: form.description,
                price: parseFloat(form.price),
                stock_quantity: parseInt(form.stock, 10),
                category_id: form.categoryId || null,
                image_url: imageUrl,
                is_featured: form.isFeatured,
            };

            if (isEditing) {
                const updatePayload = {
                    id: productId,
                    ...payload,
                    ...(vendorId ? { vendor_id: vendorId } : {}),
                };
                const updateResult = await withTimeout(
                    fetch("/api/products", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatePayload),
                    }).then(async (response) => ({
                        ok: response.ok,
                        data: await response.json(),
                    })),
                    15000,
                    "Saving product timed out. Check your Supabase schema and try again."
                );
                if (!updateResult.ok) throw new Error(updateResult.data.error || "Unable to update product.");
            } else {
                const insertResult = await withTimeout(
                    fetch("/api/products", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    }).then(async (response) => ({
                        ok: response.ok,
                        data: await response.json(),
                    })),
                    15000,
                    "Saving product timed out. Check your Supabase schema and try again."
                );
                if (!insertResult.ok) throw new Error(insertResult.data.error || "Unable to create product.");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(onSuccessPath);
            }, 2000);
        } catch (err) {
            console.error(getErrorMessage(err));
            setError(getErrorMessage(err) || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href={backPath} className={styles.backBtn}>
                    <ArrowLeft size={18} /> Back
                </Link>
                <h1 className={styles.title}>{headline}</h1>
            </div>

            {initializing && (
                <div className={styles.statusBanner}>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading product details...</span>
                </div>
            )}
            {initialError && <div className={styles.error}>{initialError}</div>}

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
                                    <label className={styles.label}>Price (INR)</label>
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
                                        <Image src={preview} alt="Preview" fill className={styles.previewImg} unoptimized />
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
                                    disabled={Boolean(categoriesError) || categories.length === 0}
                                >
                                    <option value="">
                                        {categoriesError
                                            ? "Unable to load categories"
                                            : categories.length === 0
                                                ? "No categories available"
                                                : "Select Category"}
                                    </option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {categoriesError && <p className={styles.helpText}>{categoriesError}</p>}
                                {!categoriesError && categories.length === 0 && (
                                    <p className={styles.helpText}>No categories found. Create categories from the admin panel or seed them in Supabase.</p>
                                )}
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
                        {success && (
                            <div className={styles.success}>
                                <CheckCircle size={16} />
                                {isEditing ? "Product updated successfully!" : "Product created successfully!"}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading || initializing}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    {uploading ? "Uploading Image..." : isEditing ? "Updating..." : "Saving..."}
                                </>
                            ) : isEditing ? "Save Changes" : "Publish Product"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
