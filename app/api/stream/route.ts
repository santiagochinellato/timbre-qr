import { NextRequest } from "next/server";
import Redis from "ioredis";
import { auth } from "@/lib/auth";
import { db } from "@/db";
// Use a separate connection for subscriptions as 'ioredis' puts the client in subscriber mode
const getSubscriberClient = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL);
  }
  return new Redis('redis://localhost:6379');
};

// 1. Rate limiting & Auth check
export async function GET(req: NextRequest) {
  // 1. Authentication
  const session = await auth();
  if (!session || !session.user?.id) {
      return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  // 2. Rate Limiting (10 req/min per user)
  const { checkRateLimit } = await import("@/lib/rate-limit");
  const limit = await checkRateLimit(`stream:${userId}`, 10, 60);
  if (!limit.success) {
      return new Response("Too Many Requests", { status: 429 });
  }

  // 3. Subscription Strategy: Subscribe to ALL user's units
  // Fetch units associated with user
  const userUnitsList = await db.query.userUnits.findMany({
      where: (rel, { eq }) => eq(rel.userId, userId),
      with: { unit: true }
  });

  const unitIds = userUnitsList.map(u => u.unitId);
  const channels = unitIds.map(id => `unit-${id}`);

  if (channels.length === 0) {
      // Connect but no channels (idle stream)
      console.log(`User ${userId} has no units to subscribe to.`);
  }

  const subscriber = getSubscriberClient();
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (data: unknown) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Subscribe to all channels
      if (channels.length > 0) {
          await subscriber.subscribe(...channels);
      }
      
      subscriber.on("message", (channel, message) => {
        // Since we only subscribed to units relevant to this user, we can forward everything.
        // We add the source channel for checking on client if needed (though event already has unitId).
        if (channels.includes(channel)) {
            try {
                const json = JSON.parse(message);
                sendEvent(json);
            } catch (e) {
                console.error("Error parsing message", e);
            }
        }
      });

      sendEvent({ type: "CONNECTED", userId, units: unitIds.length });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        subscriber.quit();
      });
    },
    cancel() {
        subscriber.quit();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
