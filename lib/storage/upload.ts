import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3";
import crypto from "crypto";

export async function uploadVisitorSelfie(file: File): Promise<string> {
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;

    if (!bucketName || !publicDomain) {
        throw new Error("R2 configuration missing (Bucket Name or Public Domain)");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `visitors/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: filename,
                Body: buffer,
                ContentType: file.type,
            })
        );

        return `${publicDomain}/${filename}`;
    } catch (error) {
        console.error("Upload Error:", error);
        throw new Error("Failed to upload visitor selfie");
    }
}
