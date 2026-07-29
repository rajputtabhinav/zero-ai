export interface SearchSuggestion {
    symbol: string;
    name: string;
    market: string;
}

export interface Candle {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ScalpingSignal {
    action: 'BUY' | 'SELL' | 'WAIT';
    symbol: string;
    trend15m: 'BULLISH' | 'BEARISH' | 'RANGING';
    setup5m: 'PULLBACK' | 'BREAKOUT' | 'NONE';
    confirmed3m: boolean;
    readyToScalp: boolean;
    entryPrice: number;
    target: number;
    stopLoss: number;
    profitPercent: number;
    riskPercent: number;
    riskReward: number;
    confidence: number;
    reasoning: string;
    holdTimeMinutes: number;
}

export const SCALPING_TIMEFRAMES = ['1m', '3m', '5m', '15m'];
