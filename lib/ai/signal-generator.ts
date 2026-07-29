// Trading Signal Generator
// Generates BUY/SELL signals with entry, stop-loss, take-profit

import type { EnsembleResult } from './ensemble';
import type { TechnicalAnalysis } from '../analysis/technical-indicators';

export interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  timeframe: string;
  confidence: number;
  agreement: string;
  
  // Entry and exit levels
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  riskReward: string;
  
  // Position sizing
  riskPercent: number; // % of capital to risk
  positionSize?: number; // Calculated based on account size
  
  // Signal details
  reasoning: {
    consensus: string[];
    trend: string;
    momentum: string;
    volume: string;
    structure: string;
  };
  
  // Warnings
  warnings: string[];
  
  // Trade type
  tradeType: 'SWING' | 'INTRADAY' | 'SCALP';
  holdDuration: string;
  
  // Timestamp
  timestamp: string;
  
  // Disagreements
  disagreements: Array<{ model: string; signal: string; reasoning: string }>;
  
  // Win rate history
  winRateHistory?: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

/**
 * Generate trading signal from ensemble result
 */
export function generateTradingSignal(
  ensemble: EnsembleResult,
  analysis: TechnicalAnalysis,
  timeframe: string
): TradingSignal {
  const currentPrice = analysis.price.current;
  const atr = analysis.volatility.atr;
  
  // Determine trade type based on timeframe
  const tradeType = getTradeType(timeframe);
  const holdDuration = getHoldDuration(timeframe);
  
  // Calculate entry, stop-loss, and take-profit
  const { entry, stopLoss, takeProfit } = calculateLevels(
    ensemble.signal,
    currentPrice,
    atr,
    analysis,
    tradeType
  );
  
  // Calculate risk/reward ratio
  const risk = Math.abs(entry - stopLoss);
  const reward1 = Math.abs(takeProfit[0] - entry);
  const reward2 = takeProfit[1] ? Math.abs(takeProfit[1] - entry) : reward1;
  const avgReward = (reward1 + reward2) / 2;
  const riskReward = risk > 0 ? `1:${(avgReward / risk).toFixed(1)}` : '1:0';
  
  // Calculate risk percentage (default 2% per trade)
  const riskPercent = calculateRiskPercent(ensemble.confidence, tradeType);
  
  // Generate warnings
  const warnings = generateWarnings(ensemble, analysis);
  
  return {
    signal: ensemble.signal,
    symbol: analysis.symbol,
    timeframe,
    confidence: ensemble.confidence,
    agreement: ensemble.agreement,
    entry,
    stopLoss,
    takeProfit,
    riskReward,
    riskPercent,
    reasoning: {
      consensus: ensemble.reasoning.consensus,
      trend: ensemble.reasoning.keyIndicators.trend,
      momentum: ensemble.reasoning.keyIndicators.momentum,
      volume: ensemble.reasoning.keyIndicators.volume,
      structure: ensemble.reasoning.keyIndicators.structure,
    },
    warnings,
    tradeType,
    holdDuration,
    timestamp: new Date().toISOString(),
    disagreements: ensemble.disagreements,
  };
}

/**
 * Calculate entry, stop-loss, and take-profit levels
 */
function calculateLevels(
  signal: 'BUY' | 'SELL' | 'HOLD',
  currentPrice: number,
  atr: number,
  analysis: TechnicalAnalysis,
  tradeType: 'SWING' | 'INTRADAY' | 'SCALP'
): { entry: number; stopLoss: number; takeProfit: number[] } {
  if (signal === 'HOLD') {
    return {
      entry: currentPrice,
      stopLoss: currentPrice,
      takeProfit: [currentPrice],
    };
  }
  
  // Entry price (current price + small buffer for slippage)
  const entry = currentPrice;
  
  // Stop-loss based on trade type and ATR
  let slMultiplier = 1.5; // Default for intraday
  if (tradeType === 'SWING') slMultiplier = 2.5;
  if (tradeType === 'SCALP') slMultiplier = 0.75;
  
  let stopLoss: number;
  if (signal === 'BUY') {
    stopLoss = Math.max(
      entry - atr * slMultiplier,
      analysis.supportResistance.nearestSupport * 0.995 // 0.5% below support
    );
  } else {
    stopLoss = Math.min(
      entry + atr * slMultiplier,
      analysis.supportResistance.nearestResistance * 1.005 // 0.5% above resistance
    );
  }
  
  // Take-profit levels (TP1 at 1:1.5 R:R, TP2 at 1:2.5 R:R)
  const risk = Math.abs(entry - stopLoss);
  const takeProfit: number[] = [];
  
  if (signal === 'BUY') {
    takeProfit.push(entry + risk * 1.5); // TP1
    takeProfit.push(Math.min(
      entry + risk * 2.5, // TP2
      analysis.supportResistance.nearestResistance * 0.995 // Just below resistance
    ));
  } else {
    takeProfit.push(entry - risk * 1.5); // TP1
    takeProfit.push(Math.max(
      entry - risk * 2.5, // TP2
      analysis.supportResistance.nearestSupport * 1.005 // Just above support
    ));
  }
  
  return {
    entry: Math.round(entry * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    takeProfit: takeProfit.map(tp => Math.round(tp * 100) / 100),
  };
}

/**
 * Determine trade type from timeframe
 */
function getTradeType(timeframe: string): 'SWING' | 'INTRADAY' | 'SCALP' {
  const tf = timeframe.toLowerCase();
  
  if (tf.includes('1d') || tf.includes('4h') || tf.includes('1w')) {
    return 'SWING';
  } else if (tf.includes('1h') || tf.includes('30m') || tf.includes('15m')) {
    return 'INTRADAY';
  } else {
    return 'SCALP';
  }
}

/**
 * Get hold duration estimate
 */
function getHoldDuration(timeframe: string): string {
  const tradeType = getTradeType(timeframe);
  
  switch (tradeType) {
    case 'SWING':
      return '3-7 days';
    case 'INTRADAY':
      return '1-6 hours';
    case 'SCALP':
      return '5-30 minutes';
    default:
      return 'Variable';
  }
}

/**
 * Calculate risk percentage based on confidence and trade type
 */
function calculateRiskPercent(confidence: number, tradeType: 'SWING' | 'INTRADAY' | 'SCALP'): number {
  // Base risk: 2% for swing, 1.5% for intraday, 1% for scalp
  let baseRisk = tradeType === 'SWING' ? 2.0 : tradeType === 'INTRADAY' ? 1.5 : 1.0;
  
  // Adjust based on confidence
  if (confidence >= 80) {
    baseRisk *= 1.2; // Increase risk for high confidence
  } else if (confidence >= 70) {
    baseRisk *= 1.0; // Normal risk
  } else if (confidence >= 60) {
    baseRisk *= 0.8; // Reduce risk for medium confidence
  } else {
    baseRisk *= 0.5; // Significantly reduce for low confidence
  }
  
  return Math.round(baseRisk * 10) / 10; // Round to 1 decimal
}

/**
 * Generate warnings for the signal
 */
function generateWarnings(ensemble: EnsembleResult, analysis: TechnicalAnalysis): string[] {
  const warnings: string[] = [];
  
  // Low confidence warning
  if (ensemble.confidence < 65) {
    warnings.push('⚠️ Low confidence signal - consider waiting for confirmation');
  }
  
  // Disagreement warning
  if (ensemble.disagreements.length >= 2) {
    warnings.push(`⚠️ Models disagree (${ensemble.agreement}) - higher risk`);
  }
  
  // Overbought/Oversold warning
  if (analysis.momentum.rsi.signal === 'OVERBOUGHT' && ensemble.signal === 'BUY') {
    warnings.push('⚠️ RSI overbought - potential reversal risk');
  } else if (analysis.momentum.rsi.signal === 'OVERSOLD' && ensemble.signal === 'SELL') {
    warnings.push('⚠️ RSI oversold - potential reversal risk');
  }
  
  // Weak volume warning
  if (analysis.volume.volumeRatio < 0.8) {
    warnings.push('⚠️ Low volume - weak confirmation of signal');
  }
  
  // High volatility warning
  if (analysis.volatility.volatilityLevel === 'HIGH') {
    warnings.push('⚠️ High volatility - use wider stops');
  }
  
  // Weak trend warning
  if (analysis.trend.strength === 'WEAK') {
    warnings.push('⚠️ Weak trend strength - consider smaller position size');
  }
  
  // Near resistance/support warning
  const currentPrice = analysis.price.current;
  const nearResistance = analysis.supportResistance.nearestResistance;
  const nearSupport = analysis.supportResistance.nearestSupport;
  
  if (ensemble.signal === 'BUY' && currentPrice > nearResistance * 0.98) {
    warnings.push('⚠️ Near resistance level - limited upside');
  } else if (ensemble.signal === 'SELL' && currentPrice < nearSupport * 1.02) {
    warnings.push('⚠️ Near support level - limited downside');
  }
  
  return warnings;
}

/**
 * Calculate position size based on risk percent and account size
 */
export function calculatePositionSize(
  signal: TradingSignal,
  accountSize: number
): number {
  const riskAmount = (accountSize * signal.riskPercent) / 100;
  const stopDistance = Math.abs(signal.entry - signal.stopLoss);
  
  if (stopDistance === 0) return 0;
  
  const positionSize = riskAmount / stopDistance;
  return Math.floor(positionSize * 100) / 100; // Round down to 2 decimals
}

/**
 * Format signal for display
 */
export function formatSignalForDisplay(signal: TradingSignal): string {
  const emoji = signal.signal === 'BUY' ? '🟢' : signal.signal === 'SELL' ? '🔴' : '🟡';
  
  return `
${emoji} ${signal.signal} SIGNAL - ${signal.symbol}
Confidence: ${signal.confidence}% | Agreement: ${signal.agreement}
Trade Type: ${signal.tradeType} (Hold: ${signal.holdDuration})

📈 Entry: $${signal.entry.toFixed(2)}
🛑 Stop Loss: $${signal.stopLoss.toFixed(2)} (${(((signal.stopLoss - signal.entry) / signal.entry) * 100).toFixed(2)}%)
🎯 Take Profit 1: $${signal.takeProfit[0].toFixed(2)} (${(((signal.takeProfit[0] - signal.entry) / signal.entry) * 100).toFixed(2)}%)
🎯 Take Profit 2: $${signal.takeProfit[1].toFixed(2)} (${(((signal.takeProfit[1] - signal.entry) / signal.entry) * 100).toFixed(2)}%)
⚖️ Risk:Reward = ${signal.riskReward}
💰 Risk: ${signal.riskPercent}% of capital

📊 Consensus:
${signal.reasoning.consensus.map(c => `  ${c}`).join('\n')}

${signal.warnings.length > 0 ? `\n⚠️ Warnings:\n${signal.warnings.map(w => `  ${w}`).join('\n')}` : ''}
`.trim();
}

