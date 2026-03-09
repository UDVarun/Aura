import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

// This is the public URL through which images will be served (e.g., https://pub-xxx.r2.dev)
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
});

export async function uploadImage(file: Buffer, fileName: string, contentType: string) {
    if (!R2_BUCKET_NAME) throw new Error("CLOUDFLARE_R2_BUCKET_NAME is not defined");

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: contentType,
    });

    try {
        await s3Client.send(command);
        return `${R2_PUBLIC_URL}/${fileName}`;
    } catch (error) {
        console.error("Error uploading to R2:", error);
        throw error;
    }
}

export async function deleteImage(fileName: string) {
    if (!R2_BUCKET_NAME) throw new Error("CLOUDFLARE_R2_BUCKET_NAME is not defined");

    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting from R2:", error);
        throw error;
    }
}
