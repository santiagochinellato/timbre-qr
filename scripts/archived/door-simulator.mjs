import mqtt from "mqtt";
import dotenv from "dotenv";

// Load .env.local if existing, or just use process.env
// In a script like this, we might need a custom loader or just hardcode for local dev if dotenv isn't simple.
// Let's try standard dotenv
dotenv.config({ path: ".env.local" });

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://test.mosquitto.org";

console.log(`🚪 Door Simulator starting...`);
console.log(`🔌 Connecting to Broker: ${brokerUrl}`);

const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
    console.log("✅ LIVE: Wireless Door Controller is Online");

    // Subscribe to ALL buildings
    client.subscribe("timbre-qr/+/command", (err) => {
        if (!err) {
            console.log("📡 Listening for commands on: timbre-qr/+/command");
        }
    });
});

client.on("message", (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        if (payload.action === "OPEN") {
            console.log("\n========================================");
            console.log(`🔓 DOOR OPENED!`);
            console.log(`🏢 Building Topic: ${topic}`);
            console.log(`🏠 Unit: ${payload.unit}`);
            console.log(`🔑 Log ID: ${payload.logId}`);
            console.log("========================================\n");
        }
    } catch (e) {
        console.error("Received malformed message:", message.toString());
    }
});
