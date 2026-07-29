import { useEffect, useRef, useState } from 'react';
import { getDeltaWebSocket, DeltaWebSocketMessage } from '@/lib/delta/websocket';
import { Candle } from '@/types/trading';

export function useDeltaWebSocket(symbol: string, onCandleUpdate: (candle: Candle) => void) {
    const [isConnected, setIsConnected] = useState(false);
    const wsClientRef = useRef<ReturnType<typeof getDeltaWebSocket> | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const connectWebSocket = async () => {
            try {
                const wsClient = getDeltaWebSocket();
                wsClientRef.current = wsClient;

                await wsClient.connect();
                setIsConnected(true);

                const unsubscribe = wsClient.onMessage((message: DeltaWebSocketMessage) => {
                    if (message.type === 'candle' && message.data) {
                        onCandleUpdate(message.data);
                    }
                });

                if (symbol) {
                    wsClient.subscribeCandles(symbol);
                    wsClient.subscribeTicker(symbol);
                }

                return () => {
                    unsubscribe();
                    wsClient.disconnect();
                };
            } catch (error) {
                console.error('❌ WebSocket connection error:', error);
                setIsConnected(false);
            }
        };

        const cleanupPromise = connectWebSocket();

        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, []);

    // Fix for unsubscribing old symbol
    const prevSymbolRef = useRef<string | null>(null);

    useEffect(() => {
        if (wsClientRef.current && wsClientRef.current.isConnected()) {
            // If symbol changed, unsubscribe from previous
            if (prevSymbolRef.current && prevSymbolRef.current !== symbol) {
                console.log(`📡 Unsubscribing from previous symbol: ${prevSymbolRef.current}`);
                wsClientRef.current.unsubscribeSymbol(prevSymbolRef.current);
            }

            // Subscribe to new symbol
            if (symbol) {
                console.log(`📡 Subscribing to new symbol: ${symbol}`);
                wsClientRef.current.subscribeCandles(symbol);
                wsClientRef.current.subscribeTicker(symbol);
            }

            prevSymbolRef.current = symbol;
        }
    }, [symbol, isConnected]);



    return { isConnected };
}
