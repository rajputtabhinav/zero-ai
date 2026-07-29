// Technical Indicators Calculator
// Calculates 30+ indicators for AI analysis

import {
  EMA,
  SMA,
  RSI,
  MACD,
  BollingerBands,
  ATR,
  ADX,
  Stochastic,
  OBV,
  VWAP,
  CCI,
  ROC,
  WilliamsR,
  MFI,
} from 'technicalindicators';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalAnalysis {
  symbol: string;
  timeframe: string;
  timestamp: string;
  price: {
    current: number;
    change24h: number;
    high24h: number;
    low24h: number;
  };
  trend: {
    direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: 'WEAK' | 'MEDIUM' | 'STRONG';
    ema: {
      ema9: number;
      ema21: number;
      ema50: number;
      ema200: number;
      alignment: string;
    };
    macd: {
      value: number;
      signal: number;
      histogram: number;
      crossover: 'BULLISH' | 'BEARISH' | 'NONE';
      divergence: string | null;
    };
    adx: {
      value: number;
      plusDI: number;
      minusDI: number;
    };
  };
  momentum: {
    rsi: {
      value: number;
      signal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
      divergence: string | null;
    };
    stochastic: {
      k: number;
      d: number;
      signal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
    };
    cci: number;
    williamsR: number;
    mfi: number;
    summary: string;
  };
  volatility: {
    atr: number;
    atrPercent: number;
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
      width: number;
      percentB: number;
    };
    volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  volume: {
    current: number;
    average20: number;
    volumeRatio: number;
    obv: number;
    obvTrend: 'RISING' | 'FALLING' | 'FLAT';
    vwap: number;
    priceVsVwap: 'ABOVE' | 'BELOW';
    summary: string;
  };
  supportResistance: {
    resistance: number[];
    support: number[];
    pivotPoints: {
      r3: number;
      r2: number;
      r1: number;
      pivot: number;
      s1: number;
      s2: number;
      s3: number;
    };
    nearestSupport: number;
    nearestResistance: number;
  };
  patterns: {
    candlestick: Array<{ name: string; confidence: number }>;
    divergences: string[];
  };
  marketStructure: {
    higherHighs: boolean;
    higherLows: boolean;
    structure: 'UPTREND' | 'DOWNTREND' | 'RANGING';
  };
  overallSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  reasoning: string[];
}

export function calculateAllIndicators(
  candles: Candle[],
  symbol: string,
  timeframe: string
): TechnicalAnalysis {
  if (candles.length < 200) {
    throw new Error('Need at least 200 candles for accurate analysis');
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);
  const opens = candles.map((c) => c.open);

  // Current price data
  const current = candles[candles.length - 1];
  const prev24h = candles[Math.max(0, candles.length - 24)];

  // Calculate EMAs
  const ema9Values = EMA.calculate({ period: 9, values: closes });
  const ema21Values = EMA.calculate({ period: 21, values: closes });
  const ema50Values = EMA.calculate({ period: 50, values: closes });
  const ema200Values = EMA.calculate({ period: 200, values: closes });

  const ema9 = ema9Values[ema9Values.length - 1] || current.close;
  const ema21 = ema21Values[ema21Values.length - 1] || current.close;
  const ema50 = ema50Values[ema50Values.length - 1] || current.close;
  const ema200 = ema200Values[ema200Values.length - 1] || current.close;

  // EMA alignment
  let emaAlignment = 'NEUTRAL';
  if (ema9 > ema21 && ema21 > ema50 && ema50 > ema200) {
    emaAlignment = 'BULLISH_STACK';
  } else if (ema9 < ema21 && ema21 < ema50 && ema50 < ema200) {
    emaAlignment = 'BEARISH_STACK';
  }

  // Calculate MACD
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const macd = macdValues[macdValues.length - 1] || {
    MACD: 0,
    signal: 0,
    histogram: 0,
  };
  const macdPrev = macdValues[macdValues.length - 2] || {
    MACD: 0,
    signal: 0,
    histogram: 0,
  };

  let macdCrossover: 'BULLISH' | 'BEARISH' | 'NONE' = 'NONE';
  if (macdPrev.MACD != null && macdPrev.signal != null && macd.MACD != null && macd.signal != null) {
    if (macdPrev.MACD < macdPrev.signal && macd.MACD > macd.signal) {
      macdCrossover = 'BULLISH';
    } else if (macdPrev.MACD > macdPrev.signal && macd.MACD < macd.signal) {
      macdCrossover = 'BEARISH';
    }
  }

  // Calculate ADX
  const adxValues = ADX.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
  });

  const adx = adxValues[adxValues.length - 1] || { adx: 0, pdi: 0, mdi: 0 };

  // Determine trend direction and strength
  let trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let trendStrength: 'WEAK' | 'MEDIUM' | 'STRONG' = 'WEAK';

  if (emaAlignment === 'BULLISH_STACK' && adx.pdi > adx.mdi) {
    trendDirection = 'BULLISH';
  } else if (emaAlignment === 'BEARISH_STACK' && adx.mdi > adx.pdi) {
    trendDirection = 'BEARISH';
  }

  if (adx.adx > 25) {
    trendStrength = adx.adx > 40 ? 'STRONG' : 'MEDIUM';
  }

  // Calculate RSI
  const rsiValues = RSI.calculate({ values: closes, period: 14 });
  const rsi = rsiValues[rsiValues.length - 1] || 50;

  let rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL';
  if (rsi < 30) rsiSignal = 'OVERSOLD';
  else if (rsi > 70) rsiSignal = 'OVERBOUGHT';

  // Calculate Stochastic
  const stochasticValues = Stochastic.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
    signalPeriod: 3,
  });

  const stochastic = stochasticValues[stochasticValues.length - 1] || {
    k: 50,
    d: 50,
  };

  let stochasticSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL';
  if (stochastic.k < 20) stochasticSignal = 'OVERSOLD';
  else if (stochastic.k > 80) stochasticSignal = 'OVERBOUGHT';

  // Calculate CCI
  const cciValues = CCI.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 20,
  });
  const cci = cciValues[cciValues.length - 1] || 0;

  // Calculate Williams %R
  const williamsRValues = WilliamsR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
  });
  const williamsR = williamsRValues[williamsRValues.length - 1] || -50;

  // Calculate MFI
  const mfiValues = MFI.calculate({
    high: highs,
    low: lows,
    close: closes,
    volume: volumes,
    period: 14,
  });
  const mfi = mfiValues[mfiValues.length - 1] || 50;

  // Calculate Bollinger Bands
  const bbValues = BollingerBands.calculate({
    period: 20,
    values: closes,
    stdDev: 2,
  });

  const bb = bbValues[bbValues.length - 1] || {
    upper: current.close * 1.02,
    middle: current.close,
    lower: current.close * 0.98,
    pb: 0.5,
  };

  const bbWidth = bb.upper - bb.lower;
  const percentB = (current.close - bb.lower) / bbWidth;

  // Calculate ATR
  const atrValues = ATR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
  });

  const atr = atrValues[atrValues.length - 1] || current.close * 0.01;
  const atrPercent = (atr / current.close) * 100;

  let volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (atrPercent < 1) volatilityLevel = 'LOW';
  else if (atrPercent > 3) volatilityLevel = 'HIGH';

  // Calculate OBV
  const obvValues = OBV.calculate({ close: closes, volume: volumes });
  const obv = obvValues[obvValues.length - 1] || 0;
  const obvPrev = obvValues[obvValues.length - 10] || 0;

  let obvTrend: 'RISING' | 'FALLING' | 'FLAT' = 'FLAT';
  const obvChange = ((obv - obvPrev) / Math.abs(obvPrev)) * 100;
  if (obvChange > 5) obvTrend = 'RISING';
  else if (obvChange < -5) obvTrend = 'FALLING';

  // Calculate VWAP
  const vwapValues = VWAP.calculate({
    high: highs.slice(-50),
    low: lows.slice(-50),
    close: closes.slice(-50),
    volume: volumes.slice(-50),
  });

  const vwap = vwapValues[vwapValues.length - 1] || current.close;
  const priceVsVwap = current.close > vwap ? 'ABOVE' : 'BELOW';

  // Volume analysis
  const avg20Volume =
    volumes.slice(-20).reduce((a, b) => a + b, 0) / 20 || current.volume;
  const volumeRatio = current.volume / avg20Volume;

  let volumeSummary = 'Average volume';
  if (volumeRatio > 1.5) volumeSummary = 'High volume, strong interest';
  else if (volumeRatio < 0.7) volumeSummary = 'Low volume, weak interest';

  if (obvTrend === 'RISING' && priceVsVwap === 'ABOVE') {
    volumeSummary += ', accumulation pattern';
  } else if (obvTrend === 'FALLING' && priceVsVwap === 'BELOW') {
    volumeSummary += ', distribution pattern';
  }

  // Calculate Pivot Points
  const pivotPoints = calculatePivotPoints(candles);

  // Find support and resistance levels
  const srLevels = findSupportResistance(candles);

  // Detect candlestick patterns
  const candlestickPatterns = detectCandlestickPatterns(candles.slice(-10));

  // Analyze market structure
  const marketStructure = analyzeMarketStructure(candles.slice(-50));

  // Generate reasoning
  const reasoning: string[] = [];
  let overallSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let confidence = 50;

  if (emaAlignment === 'BULLISH_STACK') {
    reasoning.push('EMA stack aligned bullishly');
    confidence += 10;
  } else if (emaAlignment === 'BEARISH_STACK') {
    reasoning.push('EMA stack aligned bearishly');
    confidence += 10;
  }

  if (macdCrossover === 'BULLISH') {
    reasoning.push('MACD bullish crossover');
    confidence += 8;
  } else if (macdCrossover === 'BEARISH') {
    reasoning.push('MACD bearish crossover');
    confidence += 8;
  }

  if (adx.adx > 25) {
    reasoning.push(`Strong ADX (${adx.adx.toFixed(1)}) confirms trend`);
    confidence += 5;
  }

  if (volumeRatio > 1.3) {
    reasoning.push(`Volume ${((volumeRatio - 1) * 100).toFixed(0)}% above average`);
    confidence += 5;
  }

  if (priceVsVwap === 'ABOVE') {
    reasoning.push('Price above VWAP (accumulation)');
    confidence += 3;
  } else {
    reasoning.push('Price below VWAP (distribution)');
  }

  if (candlestickPatterns.length > 0) {
    reasoning.push(
      `Bullish patterns: ${candlestickPatterns.map((p) => p.name).join(', ')}`
    );
    confidence += 5;
  }

  // Determine overall signal
  let bullishCount = 0;
  let bearishCount = 0;

  if (trendDirection === 'BULLISH') bullishCount += 2;
  if (trendDirection === 'BEARISH') bearishCount += 2;
  if (macdCrossover === 'BULLISH') bullishCount++;
  if (macdCrossover === 'BEARISH') bearishCount++;
  if (rsiSignal === 'OVERSOLD') bullishCount++;
  if (rsiSignal === 'OVERBOUGHT') bearishCount++;
  if (obvTrend === 'RISING') bullishCount++;
  if (obvTrend === 'FALLING') bearishCount++;
  if (priceVsVwap === 'ABOVE') bullishCount++;
  if (priceVsVwap === 'BELOW') bearishCount++;

  if (bullishCount > bearishCount + 1) {
    overallSignal = 'BULLISH';
  } else if (bearishCount > bullishCount + 1) {
    overallSignal = 'BEARISH';
  }

  confidence = Math.min(85, confidence);

  return {
    symbol,
    timeframe,
    timestamp: new Date().toISOString(),
    price: {
      current: current.close,
      change24h: ((current.close - prev24h.close) / prev24h.close) * 100,
      high24h: Math.max(...closes.slice(-24)),
      low24h: Math.min(...closes.slice(-24)),
    },
    trend: {
      direction: trendDirection,
      strength: trendStrength,
      ema: {
        ema9,
        ema21,
        ema50,
        ema200,
        alignment: emaAlignment,
      },
      macd: {
        value: macd.MACD || 0,
        signal: macd.signal || 0,
        histogram: macd.histogram || 0,
        crossover: macdCrossover,
        divergence: null,
      },
      adx: {
        value: adx.adx,
        plusDI: adx.pdi,
        minusDI: adx.mdi,
      },
    },
    momentum: {
      rsi: {
        value: rsi,
        signal: rsiSignal,
        divergence: null,
      },
      stochastic: {
        k: stochastic.k,
        d: stochastic.d,
        signal: stochasticSignal,
      },
      cci,
      williamsR,
      mfi,
      summary:
        rsiSignal === 'NEUTRAL'
          ? 'Neutral momentum'
          : rsiSignal === 'OVERSOLD'
          ? 'Oversold conditions, potential reversal'
          : 'Overbought conditions, potential reversal',
    },
    volatility: {
      atr,
      atrPercent,
      bollingerBands: {
        upper: bb.upper,
        middle: bb.middle,
        lower: bb.lower,
        width: bbWidth,
        percentB,
      },
      volatilityLevel,
    },
    volume: {
      current: current.volume,
      average20: avg20Volume,
      volumeRatio,
      obv,
      obvTrend,
      vwap,
      priceVsVwap,
      summary: volumeSummary,
    },
    supportResistance: {
      resistance: srLevels.resistance,
      support: srLevels.support,
      pivotPoints,
      nearestSupport: srLevels.support[0] || current.close * 0.98,
      nearestResistance: srLevels.resistance[0] || current.close * 1.02,
    },
    patterns: {
      candlestick: candlestickPatterns,
      divergences: [],
    },
    marketStructure,
    overallSignal,
    confidence,
    reasoning,
  };
}

function calculatePivotPoints(candles: Candle[]) {
  const last = candles[candles.length - 1];
  const high = last.high;
  const low = last.low;
  const close = last.close;

  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);

  return { r3, r2, r1, pivot, s1, s2, s3 };
}

function findSupportResistance(candles: Candle[]) {
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const current = candles[candles.length - 1].close;

  // Find local highs and lows
  const resistance: number[] = [];
  const support: number[] = [];

  for (let i = 5; i < highs.length - 5; i++) {
    const isLocalHigh = highs.slice(i - 5, i).every((h) => h < highs[i]) &&
      highs.slice(i + 1, i + 6).every((h) => h < highs[i]);

    const isLocalLow = lows.slice(i - 5, i).every((l) => l > lows[i]) &&
      lows.slice(i + 1, i + 6).every((l) => l > lows[i]);

    if (isLocalHigh && highs[i] > current) {
      resistance.push(highs[i]);
    }
    if (isLocalLow && lows[i] < current) {
      support.push(lows[i]);
    }
  }

  // Sort and take closest 3 levels
  resistance.sort((a, b) => a - b);
  support.sort((a, b) => b - a);

  return {
    resistance: resistance.slice(0, 3),
    support: support.slice(0, 3),
  };
}

function detectCandlestickPatterns(candles: Candle[]) {
  const patterns: Array<{ name: string; confidence: number }> = [];

  if (candles.length < 3) return patterns;

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  // Bullish Engulfing
  if (
    prev.close < prev.open &&
    last.close > last.open &&
    last.open < prev.close &&
    last.close > prev.open
  ) {
    patterns.push({ name: 'Bullish Engulfing', confidence: 0.85 });
  }

  // Hammer
  const bodySize = Math.abs(last.close - last.open);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  const upperWick = last.high - Math.max(last.open, last.close);

  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5) {
    patterns.push({ name: 'Hammer', confidence: 0.75 });
  }

  // Three White Soldiers
  if (
    last.close > last.open &&
    prev.close > prev.open &&
    prev2.close > prev2.open &&
    last.close > prev.close &&
    prev.close > prev2.close
  ) {
    patterns.push({ name: 'Three White Soldiers', confidence: 0.8 });
  }

  return patterns;
}

function analyzeMarketStructure(candles: Candle[]) {
  if (candles.length < 10) {
    return {
      higherHighs: false,
      higherLows: false,
      structure: 'RANGING' as const,
    };
  }

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  // Find peaks and troughs
  const peaks: number[] = [];
  const troughs: number[] = [];

  for (let i = 5; i < candles.length - 5; i++) {
    if (
      highs[i] > highs[i - 1] &&
      highs[i] > highs[i + 1] &&
      highs[i] > highs[i - 2] &&
      highs[i] > highs[i + 2]
    ) {
      peaks.push(highs[i]);
    }

    if (
      lows[i] < lows[i - 1] &&
      lows[i] < lows[i + 1] &&
      lows[i] < lows[i - 2] &&
      lows[i] < lows[i + 2]
    ) {
      troughs.push(lows[i]);
    }
  }

  // Check for higher highs and higher lows
  let higherHighs = false;
  let higherLows = false;

  if (peaks.length >= 2) {
    higherHighs = peaks[peaks.length - 1] > peaks[peaks.length - 2];
  }

  if (troughs.length >= 2) {
    higherLows = troughs[troughs.length - 1] > troughs[troughs.length - 2];
  }

  let structure: 'UPTREND' | 'DOWNTREND' | 'RANGING' = 'RANGING';
  if (higherHighs && higherLows) {
    structure = 'UPTREND';
  } else if (!higherHighs && !higherLows) {
    structure = 'DOWNTREND';
  }

  return {
    higherHighs,
    higherLows,
    structure,
  };
}

