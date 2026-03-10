import type { SupabaseClient } from "@supabase/supabase-js";

const PRODUCT_IMAGE_BUCKETS = ["product-images", "products"];

export async function uploadProductImage(
    supabase: SupabaseClient,
    file: Buffer,
    fileName: string,
    contentType: string
) {
    let lastError: Error | null = null;
    let uploadedBucket: string | null = null;

    for (const bucket of PRODUCT_IMAGE_BUCKETS) {
        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, { contentType, upsert: true });

        if (!error) {
            uploadedBucket = bucket;
            break;
        }

        lastError = error;
    }

    if (!uploadedBucket) {
        throw lastError ?? new Error("Unable to upload image to Supabase Storage.");
    }

    const { data } = supabase.storage.from(uploadedBucket).getPublicUrl(fileName);
    return data.publicUrl;
}

export async function deleteProductImage(supabase: SupabaseClient, imageUrl: string) {
    try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split("/");
        // Format: /storage/v1/object/public/product-images/filename.ext
        const fileName = pathParts[pathParts.length - 1];

        let removed = false;
        let lastError: Error | null = null;

        for (const bucket of PRODUCT_IMAGE_BUCKETS) {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([fileName]);

            if (!error) {
                removed = true;
                break;
            }

            lastError = error;
        }

        if (!removed && lastError) throw lastError;
    } catch (err) {
        console.error("Error deleting image from Supabase storage:", err);
    }
}
