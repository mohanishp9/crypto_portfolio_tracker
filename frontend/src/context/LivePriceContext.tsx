import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

interface LivePriceInfo {
    price: number;
    priceChange24h: number;
    direction: "up" | "down" | null;
    updateKey: number; // Used to re-trigger CSS animations on new updates
}

interface LivePriceContextType {
    livePrices: Record<string, LivePriceInfo>;
}

const LivePriceContext = createContext<LivePriceContextType>({ livePrices: {} });

// eslint-disable-next-line react-refresh/only-export-components
export const useLivePrices = () => useContext(LivePriceContext);

export const LivePriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [livePrices, setLivePrices] = useState<Record<string, LivePriceInfo>>({});
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLivePrices({});
            return;
        }

        const connect = () => {
            const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
            // Replace http/https with ws/wss and strip /api suffix, replacing with /ws
            const wsUrl = apiBaseUrl.replace(/^http/, "ws").replace(/\/api$/, "/ws");
            
            console.log("[WebSocket] Connecting to:", wsUrl);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "PRICE_UPDATE") {
                        const { coinId, price, priceChange24h } = data;
                        setLivePrices((prev) => {
                            const prevInfo = prev[coinId];
                            let direction: "up" | "down" | null = null;
                            if (prevInfo) {
                                if (price > prevInfo.price) {
                                    direction = "up";
                                } else if (price < prevInfo.price) {
                                    direction = "down";
                                } else {
                                    direction = prevInfo.direction;
                                }
                            }
                            
                            return {
                                ...prev,
                                [coinId]: {
                                    price,
                                    priceChange24h,
                                    direction,
                                    updateKey: (prevInfo?.updateKey ?? 0) + 1,
                                },
                            };
                        });
                    }
                } catch {
                    // Ignore parsing errors
                }
            };

            ws.onclose = () => {
                console.log("[WebSocket] Connection closed. Reconnecting in 3 seconds...");
                wsRef.current = null;
                setTimeout(() => {
                    if (isAuthenticated) connect();
                }, 3000);
            };

            ws.onerror = (error) => {
                console.error("[WebSocket] Connection error:", error);
                ws.close();
            };
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [isAuthenticated]);

    return (
        <LivePriceContext.Provider value={{ livePrices }}>
            {children}
        </LivePriceContext.Provider>
    );
};
