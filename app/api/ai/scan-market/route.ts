import { NextRequest, NextResponse } from 'next/server'
import { marketScanner } from '@/services/ai/market-scanner'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await marketScanner.findBestTradesToday({
      markets: body.markets || ['crypto', 'stocks', 'forex'],
      risk_tolerance: body.risk_tolerance || 'medium',
      timeframe: body.timeframe || '1h'
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error scanning market:', error)
    return NextResponse.json(
      { error: 'Failed to scan market', message: error.message },
      { status: 500 }
    )
  }
}

