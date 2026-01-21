import { saveLocalFile } from "./upload-local";
import { uploadVisitorSelfie } from "./upload";

export async function uploadFile(file: File): Promise<string> {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "local") {
    // If running on Vercel or Railway (Production), local filesystem is not persistent/writable for public usage.
    // Fallback to Base64 encoding (storing image in DB as text) for the demo.
    // We check NODE_ENV === "production" to cover all production deployments (Railway, Vercel, etc).
    if (process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production") {
        console.log("⚠️ Production env detected (Railway/Vercel). Using Base64 fallback for images.");
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        return `data:${mimeType};base64,${base64}`;
    }
    return saveLocalFile(file);
  }

  if (provider === "r2" || provider === "s3") {
    return uploadVisitorSelfie(file);
  }

  throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`);
}
