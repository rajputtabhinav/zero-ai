import { NextRequest, NextResponse } from 'next/server'
import { deltaClient } from '@/lib/delta/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol') || 'BTCUSDT'
    const timeframe = searchParams.get('timeframe') || '1h'
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    // Calculate date range
    const to = toStr ? new Date(toStr) : new Date()
    const from = fromStr ? new Date(fromStr) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)

    console.log(`[API] Fetching Delta Exchange candles for ${symbol}, timeframe: ${timeframe}`)
    console.log(`[API] Date range: ${from.toLocaleString()} to ${to.toLocaleString()}`)

    const candles = await deltaClient.getCandles(symbol, timeframe, from, to)

    console.log(`[API] Fetched ${candles.length} candles from Delta Exchange`)

    return NextResponse.json({ candles })
  } catch (error: any) {
    console.error('[API] Error fetching Delta candles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candles', message: error.message },
      { status: 500 }
    )
  }
}

