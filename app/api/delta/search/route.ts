import { NextRequest, NextResponse } from 'next/server'
import { deltaClient } from '@/lib/delta/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    console.log(`[API] Searching Delta Exchange for: ${query}`)

    const results = await deltaClient.searchSymbols(query)

    console.log(`[API] Found ${results.length} results`)

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('[API] Error searching Delta Exchange:', error)
    return NextResponse.json(
      { error: 'Failed to search', message: error.message },
      { status: 500 }
    )
  }
}

