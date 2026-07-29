// Ensemble Voting System
// Combines predictions from 4 models with weighted voting

import type { ModelPrediction, ModelName } from './openrouter';
import { MODELS } from './openrouter';

export interface EnsembleResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  agreement: string; // "4/4" or "3/4" etc
  reasoning: {
    consensus: string[];
    individual: Record<ModelName, { signal: string; reasoning: string; confidence: number }>;
    keyIndicators: {
      trend: string;
      momentum: string;
      volume: string;
      structure: string;
    };
  };
  disagreements: Array<{ model: ModelName; signal: string; reasoning: string }>;
  modelPredictions: ModelPrediction[];
  combinedCandles: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    time: number;
  }>;
  performanceMetrics?: {
    avgResponseTime: number;
    modelsSucceeded: number;
    modelsFailed: number;
  };
}

/**
 * Democratic ensemble voting system - all models have equal vote
 */
export function calculateEnsemble(predictions: ModelPrediction[]): EnsembleResult {
  console.log('🎯 Calculating democratic ensemble from', predictions.length, 'models');

  // Count votes (simple majority - no weights)
  const votes = {
    BUY: predictions.filter(p => p.signal === 'BUY').length,
    SELL: predictions.filter(p => p.signal === 'SELL').length,
    HOLD: predictions.filter(p => p.signal === 'HOLD').length
  };

  console.log('📊 Vote count:', votes);

  // Find signal with most votes (democratic majority)
  const finalSignal = (Object.entries(votes)
    .sort((a, b) => b[1] - a[1])[0][0] as 'BUY' | 'SELL' | 'HOLD');

  // Calculate agreement (how many voted for winner)
  const agreedModels = votes[finalSignal];
  const agreement = `${agreedModels}/${predictions.length}`;

  // Calculate average confidence (equal weight for all models)
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  // Adjust confidence based on consensus strength
  let adjustedConfidence = avgConfidence;
  let consensusStrength = 'WEAK';
  
  if (agreedModels === 4) {
    // Unanimous - highest confidence
    consensusStrength = 'UNANIMOUS';
    adjustedConfidence = Math.min(95, avgConfidence * 1.15);
    console.log('✅ UNANIMOUS agreement - boosting confidence');
  } else if (agreedModels === 3) {
    // Strong majority - normal confidence
    consensusStrength = 'STRONG';
    adjustedConfidence = avgConfidence;
    console.log('✅ STRONG majority (3/4)');
  } else if (agreedModels === 2) {
    // Split decision - reduced confidence
    consensusStrength = 'SPLIT';
    adjustedConfidence = Math.max(40, avgConfidence * 0.75);
    console.log('⚠️ SPLIT decision (2/4) - reducing confidence');
  } else {
    // Very weak - minimal confidence
    consensusStrength = 'VERY_WEAK';
    adjustedConfidence = Math.max(30, avgConfidence * 0.6);
    console.log('⚠️ VERY WEAK consensus');
  }

  // Find disagreements
  const disagreements = predictions
    .filter((p) => p.signal !== finalSignal)
    .map((p) => ({
      model: p.model,
      signal: p.signal,
      reasoning: p.reasoning,
    }));

  // Build consensus reasoning
  const consensus: string[] = [];

  if (agreedModels === 4) {
    consensus.push('✅ All 4 models unanimously agree');
  } else if (agreedModels === 3) {
    consensus.push(`⚠️ Strong consensus (3/4 models agree)`);
  } else {
    consensus.push(`⚠️ Mixed signals (${agreement} agreement)`);
  }

  // Extract common reasoning themes
  const reasoningThemes = extractCommonThemes(predictions);
  consensus.push(...reasoningThemes);

  // Combine predicted candles (weighted average)
  const combinedCandles = combineCandles(predictions);

  // Build individual model summary
  const individual = predictions.reduce(
    (acc, pred) => {
      acc[pred.model] = {
        signal: pred.signal,
        reasoning: pred.reasoning,
        confidence: pred.confidence,
      };
      return acc;
    },
    {} as Record<ModelName, { signal: string; reasoning: string; confidence: number }>
  );

  return {
    signal: finalSignal,
    confidence: Math.round(adjustedConfidence),
    agreement,
    reasoning: {
      consensus,
      individual,
      keyIndicators: {
        trend: extractIndicatorMention(predictions, ['trend', 'ema', 'macd', 'adx']),
        momentum: extractIndicatorMention(predictions, ['rsi', 'momentum', 'stochastic']),
        volume: extractIndicatorMention(predictions, ['volume', 'obv', 'vwap']),
        structure: extractIndicatorMention(predictions, ['structure', 'support', 'resistance']),
      },
    },
    disagreements,
    modelPredictions: predictions,
    combinedCandles,
  };
}

/**
 * Extract common themes from model reasonings
 */
function extractCommonThemes(predictions: ModelPrediction[]): string[] {
  const themes: string[] = [];
  const reasonings = predictions.map((p) => p.reasoning.toLowerCase());

  // Check for common keywords
  const keywords = {
    'bullish trend': ['bullish', 'uptrend', 'ascending'],
    'bearish trend': ['bearish', 'downtrend', 'descending'],
    'strong volume': ['volume', 'high volume', 'accumulation'],
    'weak volume': ['low volume', 'distribution', 'selling pressure'],
    'oversold': ['oversold', 'rsi low', 'undervalued'],
    'overbought': ['overbought', 'rsi high', 'overvalued'],
    'breakout': ['breakout', 'break out', 'breakthrough'],
    'support holding': ['support', 'holding', 'bounce'],
    'resistance': ['resistance', 'ceiling', 'rejection'],
  };

  Object.entries(keywords).forEach(([theme, kws]) => {
    const mentions = reasonings.filter((r) => kws.some((kw) => r.includes(kw))).length;
    if (mentions >= 2) {
      // At least 2 models mention it
      themes.push(`🔹 ${mentions}/4 models identify: ${theme}`);
    }
  });

  return themes.slice(0, 4); // Top 4 themes
}

/**
 * Extract indicator mentions from reasonings
 */
function extractIndicatorMention(
  predictions: ModelPrediction[],
  keywords: string[]
): string {
  const reasonings = predictions.map((p) => p.reasoning.toLowerCase());

  // Find sentences containing keywords
  const mentions = reasonings
    .flatMap((r) => r.split('.'))
    .filter((sentence) => keywords.some((kw) => sentence.includes(kw)))
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (mentions.length === 0) return 'No specific mention';

  // Return most common mention
  return mentions[0].charAt(0).toUpperCase() + mentions[0].slice(1);
}

/**
 * Combine predicted candles from all models (equal average - democratic)
 */
function combineCandles(
  predictions: ModelPrediction[]
): Array<{ open: number; high: number; low: number; close: number; time: number }> {
  // Filter predictions that have candles
  const validPredictions = predictions.filter((p) => p.nextCandles && p.nextCandles.length > 0);

  if (validPredictions.length === 0) return [];

  // Find max candle count
  const maxCandles = Math.max(...validPredictions.map((p) => p.nextCandles.length));

  const combined: Array<{ open: number; high: number; low: number; close: number; time: number }> =
    [];

  for (let i = 0; i < maxCandles; i++) {
    let openSum = 0;
    let highSum = 0;
    let lowSum = 0;
    let closeSum = 0;
    let timeSum = 0;
    let count = 0;

    validPredictions.forEach((pred) => {
      if (pred.nextCandles[i]) {
        // Equal weight for all models (democratic)
        openSum += pred.nextCandles[i].open;
        highSum += pred.nextCandles[i].high;
        lowSum += pred.nextCandles[i].low;
        closeSum += pred.nextCandles[i].close;
        timeSum += pred.nextCandles[i].time;
        count++;
      }
    });

    if (count > 0) {
      combined.push({
        open: openSum / count,
        high: highSum / count,
        low: lowSum / count,
        close: closeSum / count,
        time: Math.round(timeSum / count),
      });
    }
  }

  return combined;
}

/**
 * Detect if models strongly disagree (2-2 split)
 */
export function detectStrongDisagreement(predictions: ModelPrediction[]): boolean {
  const signalCounts = predictions.reduce(
    (acc, pred) => {
      acc[pred.signal]++;
      return acc;
    },
    { BUY: 0, SELL: 0, HOLD: 0 }
  );

  // Strong disagreement if 2-2 split between BUY and SELL
  if (signalCounts.BUY === 2 && signalCounts.SELL === 2) {
    return true;
  }

  // Or if confidence is very low across all models
  const avgConfidence =
    predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  if (avgConfidence < 50) {
    return true;
  }

  return false;
}

/**
 * Calculate performance metrics for the ensemble
 */
export function calculatePerformanceMetrics(
  predictions: ModelPrediction[],
  startTime: number
): {
  avgResponseTime: number;
  modelsSucceeded: number;
  modelsFailed: number;
} {
  const responseTime = Date.now() - startTime;

  return {
    avgResponseTime: Math.round(responseTime / predictions.length),
    modelsSucceeded: predictions.filter((p) => p.confidence > 0).length,
    modelsFailed: predictions.filter((p) => p.confidence === 0).length,
  };
}

