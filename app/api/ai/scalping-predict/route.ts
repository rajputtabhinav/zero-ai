import { NextRequest, NextResponse } from 'next/server'
import { getOpenRouterClient } from '@/lib/ai/openrouter'
import { calculateEnsemble } from '@/lib/ai/ensemble'
import { calculateAllIndicators } from '@/lib/analysis/technical-indicators'

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
  modelVotes: {
    sonnet: string
    deepseek: string
    nemotron: string
    qwen: string
  }
  agreement: string
  consensusStrength: string
}

interface ScalpingPredictionResult {
  predictions: {
    '1m': any[]
    '3m': any[]
    '5m': any[]
    '15m': any[]
  }
  signal: ScalpingSignal
}

export async function POST(request: NextRequest) {
  try {
    const { symbol, candlesData } = await request.json()

    if (!symbol || !candlesData) {
      return NextResponse.json(
        { error: 'Symbol and candlesData are required' },
        { status: 400 }
      )
    }

    // Validate we have all 4 timeframes
    const requiredTimeframes = ['1m', '3m', '5m', '15m']
    for (const tf of requiredTimeframes) {
      if (!candlesData[tf] || candlesData[tf].length < 50) {
        return NextResponse.json(
          { error: `Insufficient data for ${tf} timeframe (need 50+ candles)` },
          { status: 400 }
        )
      }
    }

    console.log(`🎯 Multi-model scalping prediction for ${symbol}`)

    // Calculate technical analysis for 15m (main trend timeframe)
    const analysis = calculateAllIndicators(candlesData['15m'], symbol, '15m')

    console.log('📊 Technical analysis complete')
    console.log(`   Trend: ${analysis.trend.direction}`)
    console.log(`   RSI: ${analysis.momentum.rsi.value.toFixed(1)}`)
    console.log(`   Signal: ${analysis.overallSignal}`)

    // Get predictions from all 4 models in parallel
    const openRouter = getOpenRouterClient()
    const predictions = await openRouter.getAllPredictions(analysis, candlesData['15m'])

    console.log('✅ Received predictions from all 4 models')
    predictions.forEach(p => {
      console.log(`   ${p.model}: ${p.signal} (${p.confidence}%)`)
    })

    // Calculate ensemble (democratic voting)
    const ensemble = calculateEnsemble(predictions)

    console.log(`🎯 Ensemble result: ${ensemble.signal} (${ensemble.confidence}% confidence)`)
    console.log(`📊 Agreement: ${ensemble.agreement}`)

    // Determine scalping-specific details
    const trend15m = analysis.trend.direction
    const setup5m = determineSetup(candlesData['5m'])
    const confirmed3m = checkConfirmation(candlesData['3m'], ensemble.signal)
    const readyToScalp = (
      ensemble.confidence >= 60 &&
      parseInt(ensemble.agreement.split('/')[0]) >= 3 &&
      trend15m !== 'NEUTRAL'
    )

    // Calculate entry/exit levels
    const currentPrice = analysis.price.current
    const entryPrice = currentPrice
    const profitPercent = 0.3 // 0.3% target for scalping
    const riskPercent = 0.15 // 0.15% stop loss

    const target = ensemble.signal === 'BUY'
      ? currentPrice * (1 + profitPercent / 100)
      : currentPrice * (1 - profitPercent / 100)

    const stopLoss = ensemble.signal === 'BUY'
      ? currentPrice * (1 - riskPercent / 100)
      : currentPrice * (1 + riskPercent / 100)

    const riskReward = profitPercent / riskPercent

    // Build scalping signal
    const signal: ScalpingSignal = {
      action: ensemble.signal === 'HOLD' ? 'WAIT' : ensemble.signal,
      symbol,
      trend15m: trend15m === 'NEUTRAL' ? 'RANGING' : trend15m,
      setup5m,
      confirmed3m,
      readyToScalp,
      entryPrice,
      target,
      stopLoss,
      profitPercent,
      riskPercent,
      riskReward,
      confidence: ensemble.confidence,
      reasoning: ensemble.reasoning.consensus.join(' | '),
      holdTimeMinutes: 10, // Typical scalp hold time
      modelVotes: {
        sonnet: predictions[0].signal,
        deepseek: predictions[1].signal,
        nemotron: predictions[2].signal,
        qwen: predictions[3].signal
      },
      agreement: ensemble.agreement,
      consensusStrength: getConsensusStrength(ensemble.agreement)
    }

    // Generate predictions for all timeframes (use ensemble combined candles)
    const result: ScalpingPredictionResult = {
      predictions: {
        '1m': ensemble.combinedCandles.slice(0, 10),
        '3m': ensemble.combinedCandles.slice(0, 10),
        '5m': ensemble.combinedCandles.slice(0, 10),
        '15m': ensemble.combinedCandles.slice(0, 10)
      },
      signal
    }

    console.log(`✅ Scalping signal generated: ${signal.action}`)
    console.log(`📊 Model votes: ${JSON.stringify(signal.modelVotes)}`)
    console.log(`🎯 Ready to scalp: ${signal.readyToScalp}`)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Scalping prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scalping prediction', message: error.message },
      { status: 500 }
    )
  }
}

function determineSetup(candles5m: any[]): 'PULLBACK' | 'BREAKOUT' | 'NONE' {
  if (!candles5m || candles5m.length < 10) return 'NONE'

  const recent = candles5m.slice(-10)
  const closes = recent.map(c => c.close)
  const highs = recent.map(c => c.high)
  const lows = recent.map(c => c.low)

  const recentHigh = Math.max(...highs)
  const recentLow = Math.min(...lows)
  const currentClose = closes[closes.length - 1]

  // Breakout if price near recent high
  if (currentClose > recentHigh * 0.998) return 'BREAKOUT'

  // Pullback if price pulled back from high
  if (currentClose < recentHigh * 0.995) return 'PULLBACK'

  return 'NONE'
}

function checkConfirmation(candles3m: any[], signal: string): boolean {
  if (!candles3m || candles3m.length < 5) return false

  const recent = candles3m.slice(-5)
  const closes = recent.map(c => c.close)

  // Check if 3m candles confirm the signal
  if (signal === 'BUY') {
    // Look for higher lows or bullish candles
    const bullishCandles = recent.filter(c => c.close > c.open).length
    return bullishCandles >= 3
  } else if (signal === 'SELL') {
    // Look for lower highs or bearish candles
    const bearishCandles = recent.filter(c => c.close < c.open).length
    return bearishCandles >= 3
  }

  return false
}

function getConsensusStrength(agreement: string): string {
  const [agreed, total] = agreement.split('/').map(Number)

  if (agreed === total) return 'UNANIMOUS'
  if (agreed === total - 1) return 'STRONG'
  if (agreed === Math.floor(total / 2)) return 'SPLIT'
  return 'WEAK'
}
