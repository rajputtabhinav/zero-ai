'use client';

import React from 'react';

export interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  timeframe: string;
  confidence: number;
  agreement: string;
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  riskReward: string;
  tradeType: string;
  reasoning: {
    consensus: string[];
    trend?: string;
    momentum?: string;
    volume?: string;
    structure?: string;
  };
  warnings: string[];
  timestamp: string;
  disagreements?: Array<{ model: string; signal: string; reasoning: string }>;
}

interface SignalDisplayProps {
  signal: TradingSignal | null;
  onClose: () => void;
  onTakeTrade?: () => void;
}

export function SignalDisplay({ signal, onClose, onTakeTrade }: SignalDisplayProps) {
  if (!signal) return null;

  const signalColor =
    signal.signal === 'BUY' ? 'text-green-400' : signal.signal === 'SELL' ? 'text-red-400' : 'text-yellow-400';
  const bgColor =
    signal.signal === 'BUY' ? 'bg-green-500/10' : signal.signal === 'SELL' ? 'bg-red-500/10' : 'bg-yellow-500/10';
  const borderColor =
    signal.signal === 'BUY' ? 'border-green-500' : signal.signal === 'SELL' ? 'border-red-500' : 'border-yellow-500';

  const emoji = signal.signal === 'BUY' ? '🟢' : signal.signal === 'SELL' ? '🔴' : '🟡';

  const entryChange = ((signal.stopLoss - signal.entry) / signal.entry) * 100;
  const tp1Change = ((signal.takeProfit[0] - signal.entry) / signal.entry) * 100;
  const tp2Change = signal.takeProfit[1] ? ((signal.takeProfit[1] - signal.entry) / signal.entry) * 100 : tp1Change;

  return (
    <div className="fixed top-16 right-4 w-96 max-h-[calc(100vh-80px)] overflow-y-auto z-50 
                    bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
      {/* Header */}
      <div className={`${bgColor} ${borderColor} border-b px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className={`font-bold text-lg ${signalColor}`}>
              {signal.signal} SIGNAL
            </h3>
            <p className="text-xs text-gray-400">
              {signal.symbol} • {signal.timeframe} • {signal.tradeType}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Confidence & Agreement */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Confidence</p>
            <p className="text-xl font-bold text-white">{signal.confidence}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Agreement</p>
            <p className="text-xl font-bold text-white">{signal.agreement}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Risk:Reward</p>
            <p className="text-xl font-bold text-white">{signal.riskReward}</p>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              signal.confidence >= 75
                ? 'bg-green-500'
                : signal.confidence >= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>

        {/* Trading Levels */}
        <div className="space-y-2 border-t border-gray-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">📈 Entry:</span>
            <span className="text-sm font-bold text-white">${signal.entry.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">🛑 Stop Loss:</span>
            <span className={`text-sm font-bold ${entryChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
              ${signal.stopLoss.toFixed(2)} ({entryChange.toFixed(2)}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">🎯 Take Profit 1:</span>
            <span className={`text-sm font-bold ${tp1Change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${signal.takeProfit[0].toFixed(2)} (+{tp1Change.toFixed(2)}%)
            </span>
          </div>

          {signal.takeProfit[1] && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">🎯 Take Profit 2:</span>
              <span className={`text-sm font-bold ${tp2Change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${signal.takeProfit[1].toFixed(2)} (+{tp2Change.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* AI Consensus */}
        <div className="border-t border-gray-800 pt-3">
          <h4 className="text-xs font-semibold text-gray-400 mb-2">📊 AI CONSENSUS:</h4>
          <div className="space-y-1">
            {signal.reasoning.consensus.map((reason, idx) => (
              <p key={idx} className="text-xs text-gray-300 leading-relaxed">
                {reason}
              </p>
            ))}
          </div>
        </div>

        {/* Key Indicators */}
        {(signal.reasoning.trend || signal.reasoning.momentum) && (
          <div className="border-t border-gray-800 pt-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">📈 KEY INDICATORS:</h4>
            <div className="space-y-1 text-xs text-gray-300">
              {signal.reasoning.trend && (
                <p>
                  <span className="text-gray-500">Trend:</span> {signal.reasoning.trend}
                </p>
              )}
              {signal.reasoning.momentum && (
                <p>
                  <span className="text-gray-500">Momentum:</span> {signal.reasoning.momentum}
                </p>
              )}
              {signal.reasoning.volume && (
                <p>
                  <span className="text-gray-500">Volume:</span> {signal.reasoning.volume}
                </p>
              )}
              {signal.reasoning.structure && (
                <p>
                  <span className="text-gray-500">Structure:</span> {signal.reasoning.structure}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {signal.warnings && signal.warnings.length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <h4 className="text-xs font-semibold text-yellow-400 mb-2">⚠️ WARNINGS:</h4>
            <div className="space-y-1">
              {signal.warnings.map((warning, idx) => (
                <p key={idx} className="text-xs text-yellow-300/80 leading-relaxed">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Disagreements */}
        {signal.disagreements && signal.disagreements.length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">
              🔀 DISAGREEMENTS ({signal.disagreements.length} models):
            </h4>
            <div className="space-y-2">
              {signal.disagreements.map((dis, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-semibold text-gray-300 capitalize">{dis.model}:</p>
                  <p className="text-gray-400">{dis.signal} - {dis.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-gray-800 pt-3 flex gap-2">
          {onTakeTrade && (
            <button
              onClick={onTakeTrade}
              className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition-colors ${
                signal.signal === 'BUY'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : signal.signal === 'SELL'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              Take Trade
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            Dismiss
          </button>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-center text-gray-500">
          Generated {new Date(signal.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

