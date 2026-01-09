'use server'

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import webpush from "web-push";

// Ensure keys are present or fail gracefully/log during dev
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:admin@bellz.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
}

export async function subscribeUser(subscription: any) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        await db.insert(pushSubscriptions).values({
            userId: session.user.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        });
        return { success: true };
    } catch (error) {
        console.error("Error subscribing user:", error);
        return { success: false, error: "Failed to subscribe" };
    }
}

export async function sendPushNotification(userId: string, title: string, body: string, url: string) {
    try {
        const subscriptions = await db.query.pushSubscriptions.findMany({
            where: eq(pushSubscriptions.userId, userId)
        });

        const payload = JSON.stringify({ title, body, url });
        console.log(`📨 [Push] Sending to ${subscriptions.length} devices for User ${userId}`);

        await Promise.all(subscriptions.map(async (sub: any) => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }, payload);
            } catch (error) {
                console.error("Error sending push to subscription:", sub.id, error);
                // Optionally delete invalid subscriptions here
            }
        }));

        return { success: true };
    } catch (error) {
         console.error("Error sending push notification:", error);
         return { success: false, error: "Failed to send notification" };
    }
}
