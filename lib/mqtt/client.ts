import mqtt from "mqtt";

/**
 * Publishes a command to the MQTT broker with a strict timeout.
 * Optimized for Door Opening usage in Serverless functions.
 */
export async function publishDoorCommand(
    buildingSlug: string,
    unitLabel: string,
    command: "OPEN",
    logId: string
): Promise<boolean> {
    const brokerUrl = process.env.MQTT_BROKER_URL;
    
    // STRUCTURED LOGGING: START
    const logPrefix = `[DOOR-OP] ${logId} | ${buildingSlug}-${unitLabel}`;
    console.log(`${logPrefix} | INITIATING Command: ${command}`);

    if (!brokerUrl) {
        console.error(`${logPrefix} | ERROR: MQTT_BROKER_URL is missing.`);
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

    // We use a Promise.race to enforce a hard timeout on the entire operation
    // (Connection + Publish). Next.js Serverless functions can't hang forever.
    const TIMEOUT_MS = 2500;

    const mqttOperation = new Promise<boolean>((resolve, reject) => {
        const client = mqtt.connect(brokerUrl, {
            connectTimeout: 2000, 
            keepalive: 5,
            protocolId: 'MQTT',
            protocolVersion: 4,
            clean: true,
            reconnectPeriod: 0, // Disable auto-reconnect for this one-shot command
        });

        // Fail fast on error
        client.on("error", (err) => {
            console.error(`${logPrefix} | MQTT Error:`, err.message);
            client.end();
            resolve(false); // Resolve false so we don't crash, just report failure
        });

        client.on("connect", () => {
            console.log(`${logPrefix} | Connected. Publishing...`);
            
            client.publish(topic, payload, { qos: 1 }, (err) => {
                client.end(); // Always disconnect immediately after publish logic
                if (err) {
                    console.error(`${logPrefix} | Publish Failed:`, err.message);
                    resolve(false);
                } else {
                    console.log(`${logPrefix} | SUCCESS: Command Sent.`);
                    resolve(true);
                }
            });
        });
    });

    const timeoutOperation = new Promise<boolean>((resolve) => {
        setTimeout(() => {
            console.error(`${logPrefix} | TIMEOUT: Operation took longer than ${TIMEOUT_MS}ms`);
            resolve(false);
        }, TIMEOUT_MS);
    });

    return Promise.race([mqttOperation, timeoutOperation]);
}
