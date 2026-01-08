import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/whatsapp/security";
import { getLogDetails, updateLogStatus } from "@/lib/dal";
import { publishDoorCommand } from "@/lib/mqtt/client";
import { z } from "zod";

// Zod Schema for Webhook Payload (simplified for the parts we care about)
const ButtonReplySchema = z.object({
    id: z.string(),
    title: z.string(),
    payload: z.string(), // "OPEN:uuid..."
});

const InteractiveMessageSchema = z.object({
    type: z.literal("button_reply"),
    button_reply: ButtonReplySchema,
});

const ResultMessageSchema = z.object({
    from: z.string(),
    id: z.string(),
    timestamp: z.string(),
    type: z.string(),
    interactive: InteractiveMessageSchema.optional(),
});

const WebhookChangeSchema = z.object({
    value: z.object({
        messaging_product: z.literal("whatsapp"),
        metadata: z.object({
            display_phone_number: z.string(),
            phone_number_id: z.string(),
        }),
        contacts: z.array(z.object({ wa_id: z.string() })).optional(),
        messages: z.array(ResultMessageSchema).optional(),
    }),
    field: z.literal("messages"),
});

const WebhookPayloadSchema = z.object({
    object: z.literal("whatsapp_business_account"),
    entry: z.array(
        z.object({
            id: z.string(),
            changes: z.array(WebhookChangeSchema),
        })
    ),
});

// GET: Verification Challenge
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const verifyToken = process.env.WA_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
        console.log("WEBHOOK_VERIFIED");
        return new NextResponse(challenge, { status: 200 });
    } else {
        return new NextResponse("Forbidden", { status: 403 });
    }
}

// POST: Event Handling
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-hub-signature-256");

        if (!signature || !verifySignature(rawBody, signature)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = JSON.parse(rawBody);

        // Quick validation
        const parsed = WebhookPayloadSchema.safeParse(body);
        if (!parsed.success) {
            // Not a message event we care about or structure changed
            // Always return 200 to Meta to avoid retries
            return NextResponse.json({ status: "ok" });
        }

        const messages = parsed.data.entry[0].changes[0].value.messages;

        if (messages && messages.length > 0) {
            const message = messages[0];

            if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                const payload = message.interactive.button_reply.payload;
                console.log("🔓 OPEN REQUEST RECEIVED:", payload);

                if (payload.startsWith("OPEN:")) {
                    const logId = payload.split("OPEN:")[1];

                    // 1. Validate Log & Get Context
                    const log = await getLogDetails(logId);

                    if (log && log.status !== 'opened') {
                        console.log(`Processing Open for Unit ${log.unitLabel} in ${log.buildingSlug}`);

                        // 2. Publish MQTT Command
                        const sent = await publishDoorCommand(
                            log.buildingSlug,
                            log.unitLabel,
                            "OPEN",
                            logId
                        );

                        if (sent) {
                            // 3. Update DB
                            await updateLogStatus(logId, 'opened');
                            console.log("✅ Access Granted & Logged");
                        } else {
                            console.error("Failed to send MQTT command");
                        }
                    } else {
                        console.warn("Log not found or already opened", logId);
                    }
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
