const WebSocket = require('ws');

const url = 'wss://timbre-qr-production.up.railway.app';
console.log(`Connecting to ${url}...`);

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('✅ Connection Opened!');
  ws.close();
});

ws.on('error', (err) => {
  console.error('❌ Connection Error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`Connection Closed. Code: ${code}, Reason: ${reason}`);
});
