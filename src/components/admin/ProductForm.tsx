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
    
    // Multi-image state
    const [images, setImages] = useState<{ id?: string, url: string, file?: File, isLocal?: boolean }[]>([]);
    const [imageUrlInput, setImageUrlInput] = useState("");
    
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
                    .select("title, description, price, stock_quantity, category_id, is_featured, image_url, vendor_id, product_images(id, url, display_order)")
                    .eq("id", productId)
                    .single() as any;

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
                
                // Load images: main image_url first, then product_images
                const loadedImages = [];
                if (data.image_url) {
                    loadedImages.push({ url: data.image_url });
                }
                
                if (data.product_images && (data.product_images as any[]).length > 0) {
                    const extraImages = (data.product_images as any[])
                        .sort((a, b) => a.display_order - b.display_order)
                        .map(img => ({ id: img.id, url: img.url }));
                    
                    // Filter out duplicate main image if it exists in product_images too
                    const mainUrl = data.image_url;
                    extraImages.forEach(img => {
                        if (img.url !== mainUrl) loadedImages.push(img);
                    });
                }
                
                setImages(loadedImages);
                setVendorId(data.vendor_id ?? null);
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
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const newImages = Array.from(selectedFiles).map(file => ({
                url: URL.createObjectURL(file),
                file,
                isLocal: true
            }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const addImageUrl = () => {
        if (!imageUrlInput.trim()) return;
        setImages(prev => [...prev, { url: imageUrlInput.trim() }]);
        setImageUrlInput("");
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Process all images
            const finalImageUrls: string[] = [];
            
            setUploading(true);
            for (const img of images) {
                if (img.isLocal && img.file) {
                    const formData = new FormData();
                    formData.append("file", img.file);

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
                    finalImageUrls.push(uploadData.data.url);
                } else {
                    finalImageUrls.push(img.url);
                }
            }
            setUploading(false);

            const payload = {
                title: form.title,
                description: form.description,
                price: parseFloat(form.price),
                stock_quantity: parseInt(form.stock, 10),
                category_id: form.categoryId || null,
                image_url: finalImageUrls.length > 0 ? finalImageUrls[0] : null,
                images: finalImageUrls, // Send full array to batch upsert
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
            setUploading(false);
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
                            <h2 className={styles.cardTitle}>Product Gallery</h2>
                            
                            <div className={styles.imageList}>
                                {images.map((img, idx) => (
                                    <div key={idx} className={styles.imageItem}>
                                        <div className={styles.imagePreview}>
                                            <Image src={img.url} alt={`Preview ${idx}`} fill className={styles.previewImg} unoptimized />
                                            <button type="button" onClick={() => removeImage(idx)} className={styles.removeBtn}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {idx === 0 && <span className={styles.mainBadge}>Cover</span>}
                                    </div>
                                ))}
                                
                                <label className={styles.addCard}>
                                    <Upload size={20} />
                                    <span>Upload</span>
                                    <input
                                        type="file"
                                        className={styles.hiddenInput}
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            <div className={styles.urlInputGroup}>
                                <input 
                                    type="text" 
                                    className="input" 
                                    placeholder="Paste external image URL..." 
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                                />
                                <button type="button" onClick={addImageUrl} className="btn">Add</button>
                            </div>
                            
                            <p className={styles.helpText}>Drag and drop or upload multiple files. You can also paste external links.</p>
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
                                    {uploading ? "Uploading Images..." : isEditing ? "Updating..." : "Saving..."}
                                </>
                            ) : isEditing ? "Save Changes" : "Publish Product"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
