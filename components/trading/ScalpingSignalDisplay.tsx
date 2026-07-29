'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface ScalpingSignal {
  action: 'BUY' | 'SELL' | 'WAIT'
  symbol: string
  trend15m: 'BULLISH' | 'BEARISH' | 'RANGING'
  setup5m: 'PULLBACK' | 'BREAKOUT' | 'NONE'
  confirmed3m: boolean
  readyToScalp: boolean
  entryPrice: number
  target: number
  stopLoss: number
  profitPercent: number
  riskPercent: number
  riskReward: number
  confidence: number
  reasoning: string
  holdTimeMinutes: number
  modelVotes?: {
    sonnet: string
    deepseek: string
    nemotron: string
    qwen: string
  }
  agreement?: string
  consensusStrength?: string
}

interface ScalpingSignalDisplayProps {
  signal: ScalpingSignal
  onClose: () => void
  onTakeTrade?: () => void
}

export function ScalpingSignalDisplay({ signal, onClose, onTakeTrade }: ScalpingSignalDisplayProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border-2 border-green-500 rounded-lg p-4 w-80 shadow-2xl z-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-white font-bold text-lg">
          ⚡ SCALPING SIGNAL
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>
      
      {/* Action */}
      <div className={`text-2xl font-bold mb-3 ${
        signal.action === 'BUY' ? 'text-green-400' : 
        signal.action === 'SELL' ? 'text-red-400' : 'text-yellow-400'
      }`}>
        {signal.action} {signal.symbol}
      </div>
      
      {/* Timeframe Analysis */}
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-gray-400">15m Trend:</span>
          <span className={`font-bold ${
            signal.trend15m === 'BULLISH' ? 'text-green-400' :
            signal.trend15m === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {signal.trend15m}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">5m Setup:</span>
          <span className="text-green-400">{signal.setup5m}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">3m Confirm:</span>
          <span className={signal.confirmed3m ? 'text-green-400' : 'text-yellow-400'}>
            {signal.confirmed3m ? '✓ YES' : '⏳ WAIT'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Hold Time:</span>
          <span className="text-blue-400">{signal.holdTimeMinutes} min</span>
        </div>
      </div>
      
      {/* Entry/Exit */}
      <div className="border-t border-gray-700 pt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Entry:</span>
          <span className="text-white font-bold">${signal.entryPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-400">Target:</span>
          <span className="text-green-400 font-bold">
            ${signal.target.toFixed(2)} (+{signal.profitPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-400">Stop Loss:</span>
          <span className="text-red-400 font-bold">
            ${signal.stopLoss.toFixed(2)} (-{signal.riskPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">R:R Ratio:</span>
          <span className="text-yellow-400 font-bold">1:{signal.riskReward.toFixed(1)}</span>
        </div>
      </div>
      
      {/* Confidence */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Confidence</div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              signal.confidence >= 70 ? 'bg-green-500' :
              signal.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1 text-right">
          {signal.confidence}%
        </div>
      </div>
      
      {/* Model Votes */}
      {signal.modelVotes && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2 font-semibold">AI Model Votes ({signal.agreement})</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">Claude Sonnet:</span>
              <span className={`font-bold ${
                signal.modelVotes.sonnet === 'BUY' ? 'text-green-400' :
                signal.modelVotes.sonnet === 'SELL' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {signal.modelVotes.sonnet}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">DeepSeek R1:</span>
              <span className={`font-bold ${
                signal.modelVotes.deepseek === 'BUY' ? 'text-green-400' :
                signal.modelVotes.deepseek === 'SELL' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {signal.modelVotes.deepseek}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Nemotron:</span>
              <span className={`font-bold ${
                signal.modelVotes.nemotron === 'BUY' ? 'text-green-400' :
                signal.modelVotes.nemotron === 'SELL' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {signal.modelVotes.nemotron}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Qwen 2.5:</span>
              <span className={`font-bold ${
                signal.modelVotes.qwen === 'BUY' ? 'text-green-400' :
                signal.modelVotes.qwen === 'SELL' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {signal.modelVotes.qwen}
              </span>
            </div>
          </div>
          {signal.consensusStrength && (
            <div className="mt-2 text-center">
              <span className={`text-xs font-bold ${
                signal.consensusStrength === 'UNANIMOUS' ? 'text-green-400' :
                signal.consensusStrength === 'STRONG' ? 'text-blue-400' :
                signal.consensusStrength === 'SPLIT' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {signal.consensusStrength} CONSENSUS
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reasoning */}
      <div className="mt-3 text-xs text-gray-400 italic max-h-20 overflow-y-auto">
        {signal.reasoning}
      </div>

      {/* Action Buttons */}
      {onTakeTrade && signal.action !== 'WAIT' && (
        <div className="mt-4 flex gap-2">
          <Button
            onClick={onTakeTrade}
            className={`flex-1 ${
              signal.action === 'BUY' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            } text-white font-bold`}
          >
            Take Trade
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
          >
            Dismiss
          </Button>
        </div>
      )}
      
      {/* Ready to Scalp Indicator */}
      {signal.readyToScalp && (
        <div className="mt-3 bg-green-600 text-white text-center py-2 rounded font-bold animate-pulse">
          🎯 READY TO SCALP!
        </div>
      )}
    </div>
  )
}

