import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface BinanceTickerMessage {
    s: string; // Symbol, e.g., "BTCUSDT"
    c: string; // Current price
    P: string; // Price change percentage 24h
}

// Maps Binance symbols to CoinGecko IDs
const SYMBOL_MAP: Record<string, { coinId: string; symbol: string }> = {
    BTCUSDT: { coinId: "bitcoin", symbol: "btc" },
    ETHUSDT: { coinId: "ethereum", symbol: "eth" },
    BNBUSDT: { coinId: "binancecoin", symbol: "bnb" },
    SOLUSDT: { coinId: "solana", symbol: "sol" },
    XRPUSDT: { coinId: "ripple", symbol: "xrp" },
    DOGEUSDT: { coinId: "dogecoin", symbol: "doge" },
    ADAUSDT: { coinId: "cardano", symbol: "ada" },
    DOTUSDT: { coinId: "polkadot", symbol: "dot" },
    LINKUSDT: { coinId: "chainlink", symbol: "link" },
};

export const initWebSocketServer = (server: HttpServer): void => {
    console.log("[WebSocket] Initializing MERN WebSocket server...");
    const wss = new WebSocketServer({ noServer: false, server, path: "/ws" });

    // Store active client connections
    const clients = new Set<WebSocket>();

    wss.on("connection", (ws: WebSocket) => {
        clients.add(ws);
        console.log(`[WebSocket] Client connected. Total clients: ${clients.size}`);

        ws.on("close", () => {
            clients.delete(ws);
            console.log(`[WebSocket] Client disconnected. Total clients: ${clients.size}`);
        });

        ws.on("error", (error) => {
            console.error("[WebSocket] Client connection error:", error);
            clients.delete(ws);
        });
    });

    // Connect to Binance Public Stream
    let binanceWs: WebSocket | null = null;
    const connectToBinance = () => {
        console.log("[WebSocket] Connecting to Binance public WebSocket feed...");
        const streams = Object.keys(SYMBOL_MAP).map(s => `${s.toLowerCase()}@ticker`).join("/");
        binanceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

        binanceWs.on("open", () => {
            console.log("[WebSocket] Connected to Binance stream successfully.");
        });

        binanceWs.on("message", (data: string) => {
            try {
                const message: BinanceTickerMessage = JSON.parse(data);
                const mapEntry = SYMBOL_MAP[message.s];
                if (mapEntry) {
                    const priceUpdate = {
                        type: "PRICE_UPDATE",
                        coinId: mapEntry.coinId,
                        symbol: mapEntry.symbol,
                        price: parseFloat(message.c),
                        priceChange24h: parseFloat(message.P),
                    };

                    // Broadcast to all connected MERN clients
                    const payload = JSON.stringify(priceUpdate);
                    clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(payload);
                        }
                    });
                }
            } catch (err) {
                // Ignore parsing errors
            }
        });

        binanceWs.on("close", () => {
            console.log("[WebSocket] Binance stream closed. Retrying connection in 5 seconds...");
            binanceWs = null;
            setTimeout(connectToBinance, 5000);
        });

        binanceWs.on("error", (error) => {
            console.error("[WebSocket] Binance stream error:", error.message || error);
            binanceWs?.close();
        });
    };

    connectToBinance();
};
