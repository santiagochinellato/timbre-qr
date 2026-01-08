import crypto from "crypto";

export function verifySignature(body: string, signature: string): boolean {
    const secret = process.env.WA_APP_SECRET;
    if (!secret) {
        console.error("WA_APP_SECRET is not defined");
        return false;
    }

    // Signature comes as "sha256=..."
    const signatureHash = signature.split("=")[1];
    if (!signatureHash) return false;

    const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return signatureHash === expectedHash;
}
