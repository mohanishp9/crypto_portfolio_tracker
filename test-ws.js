const WebSocket = require('ws');

const ws = new WebSocket('wss://stream.binance.us:9443/ws/btcusdt@ticker');

ws.on('open', () => {
  console.log('Connected to Binance.US');
});

ws.on('message', (data) => {
  console.log('Message:', data.toString());
  ws.close();
});

ws.on('error', (err) => {
  console.error('Error:', err);
});
