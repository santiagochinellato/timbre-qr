import { NextRequest } from "next/server";
import Redis from "ioredis";

// Use a separate connection for subscriptions as 'ioredis' puts the client in subscriber mode
const getSubscriberClient = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL);
  }
  return new Redis('redis://localhost:6379');
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unitId = searchParams.get("unitId");

  // TODO: Add Authentication Check here (req.auth or similar)
  // For now we assume the middleware/layout protects access or we add a quick check if needed.
  // const session = await auth();
  // if (!session) return new Response("Unauthorized", { status: 401 });

  if (!unitId) {
    return new Response("Missing unitId", { status: 400 });
  }

  const channelName = `unit-${unitId}`;
  
  // Create a dedicated subscriber for this connection
  const subscriber = getSubscriberClient();
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // 1. Helper to send data
      const sendEvent = (data: unknown) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // 2. Subscribe to Redis
      await subscriber.subscribe(channelName);
      
      // 3. Listen for messages
      subscriber.on("message", (channel, message) => {
        if (channel === channelName) {
            try {
                const json = JSON.parse(message);
                sendEvent(json);
            } catch (e) {
                console.error("Error parsing message", e);
            }
        }
      });

      // 4. Send initial connection success logic
      sendEvent({ type: "CONNECTED", unitId });

      // 5. Heartbeat to keep connection alive (prevent timeouts)
      const heartbeat = setInterval(() => {
        // Comment: is an empty comment line to keep connection open
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000); // 15 seconds

      // Cleanup when connection closes
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        subscriber.quit();
        console.log(`Streaming closed for ${unitId}`);
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
