import { redis } from "@/lib/redis";

/**
 * Publishes an event to a specific Redis channel.
 * @param channel The channel name (e.g., 'unit-123')
 * @param event The event data object (must be serializable)
 */
export async function publishEvent(channel: string, event: Record<string, unknown>) {
    try {
        const payload = JSON.stringify(event);
        await redis.publish(channel, payload);
        console.log(`📡 Event published to [${channel}]:`, event.type || "unknown");
    } catch (error) {
        console.error("❌ Failed to publish event:", error);
    }
}

/**
 * Common Event Types
 */
export type DoorbellEventType = 
    | "RINGING"
    | "REJECTED"
    | "RESPONSE_SENT"
    | "DOOR_OPENED"
    | "CALL_ENDED";

export interface DoorbellEvent {
    type: DoorbellEventType;
    timestamp: number;
    unitId: string;
    payload?: Record<string, unknown>;
}
