import mqtt from "mqtt";

// Serverless-friendly MQTT: Connect -> Publish -> Disconnect
export async function publishDoorCommand(
    buildingSlug: string,
    unitLabel: string,
    command: "OPEN",
    logId: string
) {
    const brokerUrl = process.env.MQTT_BROKER_URL;
    if (!brokerUrl) {
        console.warn("MQTT_BROKER_URL is missing. Door command skipped.");
        return false;
    }

    const topic = `timbre-qr/${buildingSlug}/command`;
    const payload = JSON.stringify({
        type: "DOOR_CONTROL",
        unit: unitLabel,
        action: command,
        logId: logId,
        timestamp: Date.now(),
    });

    console.log(`🔌 Connecting to MQTT Broker...`);

    return new Promise<boolean>((resolve, reject) => {
        const client = mqtt.connect(brokerUrl, {
            connectTimeout: 5000, // 5s timeout
        });

        client.on("connect", () => {
            console.log(`🔌 Connected! Publishing to ${topic}...`);

            client.publish(topic, payload, { qos: 1 }, (err) => {
                if (err) {
                    console.error("MQTT Publish Error:", err);
                    client.end();
                    resolve(false);
                } else {
                    console.log("🚀 Command Sent!");
                    client.end();
                    resolve(true);
                }
            });
        });

        client.on("error", (err) => {
            console.error("MQTT Connection Error:", err);
            client.end();
            resolve(false); // Resolve false instead of reject to avoid crashing serverless fn
        });

        // Safety timeout
        setTimeout(() => {
            if (client.connected) client.end();
            resolve(false);
        }, 6000);
    });
}
