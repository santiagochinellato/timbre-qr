const WebSocket = require('ws');

const WS_URL = 'ws://localhost:9999';

console.log(`Connecting to ${WS_URL}...`);
const ws = new WebSocket(WS_URL);

let messageCount = 0;
let bytesReceived = 0;
const timeout = setTimeout(() => {
    console.log('\n❌ TIMEOUT: No data received in 5 seconds.');
    cleanup();
    process.exit(1);
}, 15000);

ws.on('open', () => {
    console.log('✅ WebSocket Connected.');
});

ws.on('message', (data) => {
    messageCount++;
    bytesReceived += data.length;
    
    // Print progress every 10 messages
    if (messageCount % 10 === 0) {
        process.stdout.write(`\rReceived ${messageCount} packets (${(bytesReceived / 1024).toFixed(2)} KB)`);
    }

    // Success condition: meaningful amount of data
    if (bytesReceived > 1024 * 50) { // 50KB
        console.log(`\n\n✅ SUCCESS: Stream is flowing! Received ${bytesReceived} bytes.`);
        cleanup();
        process.exit(0);
    }
});

ws.on('error', (err) => {
    console.log(`\n❌ WebSocket Error: ${err.message}`);
    cleanup();
    process.exit(1);
});

ws.on('close', () => {
    console.log('\n⚠️ WebSocket Disconnected.');
});

function cleanup() {
    clearTimeout(timeout);
    ws.close();
}
