import { NextRequest, NextResponse } from 'next/server'
import { deltaClient } from '@/lib/delta/client'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Fetching Delta Exchange products...')

    const products = await deltaClient.getSpotProducts()

    // Format for frontend dropdown
    const formattedProducts = products.map((product: any) => ({
      symbol: product.symbol,
      name: product.description || product.symbol,
      market: 'crypto',
      underlying: product.underlying_asset?.symbol || '',
      quoting: product.quoting_asset?.symbol || ''
    }))

    console.log(`[API] Returning ${formattedProducts.length} products`)

    return NextResponse.json({ 
      products: formattedProducts,
      count: formattedProducts.length
    })
  } catch (error: any) {
    console.error('[API] Error fetching Delta products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', message: error.message },
      { status: 500 }
    )
  }
}

