import { saveLocalFile } from "./upload-local";
import { uploadVisitorSelfie } from "./upload";

export async function uploadFile(file: File): Promise<string> {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "local") {
    // Determine if we are in a Vercel-like environment where local fs is readonly/ephemeral
    if (process.env.VERCEL) {
        console.warn("⚠️ STORAGE_PROVIDER is 'local' but running on Vercel. Images will be lost/unreachable.");
    }
    return saveLocalFile(file);
  }

  if (provider === "r2" || provider === "s3") {
    return uploadVisitorSelfie(file);
  }

  throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`);
}
