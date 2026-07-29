import { NextRequest, NextResponse } from 'next/server'
import { generatePredictions } from '@/lib/ai/claude'
import { deltaClient } from '@/lib/delta/client'
import { cacheHelpers } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const { symbol, timeframe = '1H' } = await request.json()

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cached = await cacheHelpers.getPrediction(symbol, timeframe)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get historical candles
    const candles = await deltaClient.getCandles(symbol, timeframe, undefined, undefined)

    // Calculate technical indicators (simplified)
    const indicators = calculateIndicators(candles)

    // Generate AI predictions
    const prediction = await generatePredictions(symbol, candles, indicators)

    // Cache prediction for 5 minutes
    await cacheHelpers.setPrediction(symbol, timeframe, prediction, 300)

    return NextResponse.json(prediction)
  } catch (error: any) {
    console.error('Error generating prediction:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction', message: error.message },
      { status: 500 }
    )
  }
}

function calculateIndicators(candles: any[]) {
  // Simplified indicator calculation
  const closes = candles.map(c => c.close)
  const volumes = candles.map(c => c.volume)

  return {
    RSI: calculateRSI(closes, 14),
    MACD: { signal: 0, histogram: 0 },
    SMA_20: average(closes.slice(-20)),
    SMA_50: average(closes.slice(-50)),
    volume_avg: average(volumes.slice(-20)),
    current_price: closes[closes.length - 1]
  }
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period) return 50

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains += change
    else losses += Math.abs(change)
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

