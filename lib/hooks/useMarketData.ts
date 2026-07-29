import { useState, useCallback, useEffect } from 'react';
import { Candle, SCALPING_TIMEFRAMES } from '@/types/trading';
import { syncTime, getAccurateTime, isSynced } from '@/lib/time-sync';

export function useMarketData(symbol: string) {
    const [candlesData, setCandlesData] = useState<Record<string, Candle[]>>({
        '1m': [], '3m': [], '5m': [], '15m': []
    });
    const [predictionsData, setPredictionsData] = useState<Record<string, Candle[]>>({
        '1m': [], '3m': [], '5m': [], '15m': []
    });
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const loadCandles = useCallback(async () => {
        if (!symbol || symbol.length < 3) return;

        setLoading(true);
        setPredictionsData({ '1m': [], '3m': [], '5m': [], '15m': [] });

        try {
            if (!isSynced()) {
                await syncTime();
            }

            const now = getAccurateTime();
            const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

            const promises = SCALPING_TIMEFRAMES.map(tf =>
                fetch(`/api/delta/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${tf}&from=${sixHoursAgo.toISOString()}&to=${now.toISOString()}`)
                    .then(res => res.json())
            );

            const results = await Promise.all(promises);

            const newCandlesData: Record<string, Candle[]> = {};
            SCALPING_TIMEFRAMES.forEach((tf, index) => {
                if (results[index].candles && results[index].candles.length > 0) {
                    const uniqueCandles = Array.from(
                        new Map(results[index].candles.map((c: Candle) => [c.timestamp, c])).values()
                    ) as Candle[];
                    newCandlesData[tf] = uniqueCandles.sort((a: Candle, b: Candle) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                } else {
                    newCandlesData[tf] = [];
                }
            });

            setCandlesData(newCandlesData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('❌ Error loading candles:', error);
            setCandlesData({ '1m': [], '3m': [], '5m': [], '15m': [] });
        } finally {
            setLoading(false);
        }
    }, [symbol]);


    useEffect(() => {
        loadCandles();
    }, [loadCandles]);

    const updateCandle = useCallback((newCandle: Candle) => {
        setCandlesData(prev => {
            // Create a shallow copy of the state object
            const newData = { ...prev };

            // Helper to get bucket start time
            const getBucketStartTime = (timestamp: string, minutes: number) => {
                const date = new Date(timestamp);
                const ms = date.getTime();
                const bucketMs = minutes * 60 * 1000;
                return new Date(Math.floor(ms / bucketMs) * bucketMs).toISOString();
            };

            // Update 1m timeframe
            if (newData['1m']) {
                // Create a copy of the array to avoid mutation
                const current1m = [...newData['1m']];
                const lastCandle = current1m[current1m.length - 1];

                if (lastCandle && new Date(newCandle.timestamp).getTime() === new Date(lastCandle.timestamp).getTime()) {
                    // Update existing candle
                    current1m[current1m.length - 1] = newCandle;
                } else {
                    // Add new candle
                    current1m.push(newCandle);
                }
                newData['1m'] = current1m;
            }

            // Update higher timeframes (3m, 5m, 15m) via aggregation
            ['3m', '5m', '15m'].forEach(tf => {
                if (!newData[tf]) return;

                const minutes = parseInt(tf.replace('m', ''));
                const bucketStartTime = getBucketStartTime(newCandle.timestamp, minutes);

                // Create a copy of the array
                const currentTf = [...newData[tf]];
                const lastCandle = currentTf[currentTf.length - 1];

                if (lastCandle && lastCandle.timestamp === bucketStartTime) {
                    // Update existing candle with aggregated data
                    currentTf[currentTf.length - 1] = {
                        ...lastCandle,
                        high: Math.max(lastCandle.high, newCandle.high),
                        low: Math.min(lastCandle.low, newCandle.low),
                        close: newCandle.close,
                        volume: lastCandle.volume // Keep volume simple for now
                    };
                } else {
                    // Create new candle
                    const newAggregatedCandle: Candle = {
                        timestamp: bucketStartTime,
                        open: newCandle.open,
                        high: newCandle.high,
                        low: newCandle.low,
                        close: newCandle.close,
                        volume: newCandle.volume
                    };

                    // Only add if it's newer
                    if (!lastCandle || new Date(bucketStartTime).getTime() > new Date(lastCandle.timestamp).getTime()) {
                        currentTf.push(newAggregatedCandle);
                    }
                }
                newData[tf] = currentTf;
            });

            return newData;
        });
        setLastUpdate(new Date());
    }, []);

    return {
        candlesData,
        setCandlesData,
        predictionsData,
        setPredictionsData,
        loading,
        lastUpdate,
        loadCandles,
        updateCandle
    };
}
