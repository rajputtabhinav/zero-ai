import { claude, MODEL, WEB_SEARCH_TOOL } from '@/lib/ai/claude'
import { deltaClient } from '@/lib/delta/client'
import { cacheHelpers } from '@/lib/redis'

export interface TradingOpportunity {
  rank: number
  asset: string
  market: string
  score: number
  setup_quality: number
  confidence: number
  trade_setup: {
    entry: number
    stop_loss: number
    take_profit: number
    risk_reward: number
    position_size: string
  }
  strategy: string
  timeframe: string
  risk_level: string
  catalysts: string[]
  reasoning: string
  news_sources: string[]
}

export interface MarketScanResult {
  scan_timestamp: string
  total_scanned: number
  opportunities: TradingOpportunity[]
}

export class AIMarketScanner {
  async findBestTradesToday(preferences?: {
    markets?: string[]
    risk_tolerance?: string
    timeframe?: string
    min_volume?: number
  }): Promise<MarketScanResult> {
    // Check cache first (10 minute TTL)
    const cached = await cacheHelpers.getScanResults()
    if (cached) {
      return cached
    }

    console.log('Starting AI market scan...')

    // Phase 1: Web search for trending assets
    const trendingAssets = await this.webSearchTrending()

    // Phase 2: Technical screening (simplified for initial version)
    const filteredAssets = trendingAssets.slice(0, 30) // Top 30 for deep analysis

    // Phase 3: Deep analysis of each asset
    const opportunities = await this.deepAnalyzeAssets(filteredAssets)

    // Phase 4: Rank and return top 10
    const ranked = this.rankOpportunities(opportunities)

    const result: MarketScanResult = {
      scan_timestamp: new Date().toISOString(),
      total_scanned: trendingAssets.length,
      opportunities: ranked.slice(0, 10)
    }

    // Cache results
    await cacheHelpers.setScanResults(result, 600) // 10 minutes

    return result
  }

  private async webSearchTrending(): Promise<any[]> {
    console.log('Searching web for trending assets...')

    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You are a market scanner for Zero.AI trading platform.

TODAY'S DATE: ${new Date().toISOString()}

TASK: Find the BEST trading opportunities TODAY by searching:

1. CRYPTO:
   - Search "trending cryptocurrencies today"
   - Search "crypto with high volume today"
   - Search "crypto news today"
   - Look for: New listings, partnerships, tech upgrades, whale activity

2. STOCKS:
   - Search "stocks moving today"
   - Search "earnings reports today"
   - Search "stock market movers"
   - Look for: Earnings beats, analyst upgrades, major news

3. FOREX:
   - Search "forex pairs with high volatility today"
   - Search "economic calendar today"
   - Search "forex news today"
   - Look for: Central bank news, economic data releases

Return JSON with TOP 30 assets that have:
- High volume/liquidity
- Recent news catalyst
- Potential for volatility
- Clear technical setup

Format:
{
  "assets": [
    {
      "symbol": "BTC/USD",
      "market": "crypto",
      "reason": "Fed pivot news + whale accumulation",
      "priority": "high"
    }
  ]
}`
      }],
      tools: [{ ...WEB_SEARCH_TOOL, max_uses: 15 } as any]
    })

    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return []
    }

    try {
      const data = JSON.parse(textContent.text)
      return data.assets || []
    } catch (error) {
      console.error('Failed to parse trending assets:', error)
      return []
    }
  }

  private async deepAnalyzeAssets(assets: any[]): Promise<any[]> {
    console.log(`[Scanner] Deep analyzing ${assets.length} assets...`)

    // Analyze in batches to avoid rate limits
    const batchSize = 5
    const results = []

    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize)
      console.log(`[Scanner] Analyzing batch ${i / batchSize + 1}/${Math.ceil(assets.length / batchSize)}`)

      const batchResults = await Promise.allSettled(
        batch.map(asset => this.analyzeAsset(asset))
      )

      results.push(...batchResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(Boolean))
    }

    return results
  }

  private async analyzeAsset(asset: any): Promise<any> {
    try {
      console.log(`[Scanner] Analyzing ${asset.symbol}...`)

      // Get candle data from Delta Exchange API
      const candles = await deltaClient.getCandles(asset.symbol, '1H', undefined, undefined)

      if (!candles || candles.length === 0) {
        console.warn(`[Scanner] No candle data for ${asset.symbol}, skipping`)
        return null
      }

      const response = await claude.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Analyze ${asset.symbol} for TODAY's trading opportunity.

ASSET: ${asset.symbol}
MARKET: ${asset.market}
INITIAL REASON: ${asset.reason}

RECENT CANDLES (Last 100):
${JSON.stringify(candles.slice(-50))}

Search for latest specific news about ${asset.symbol} and provide:

Return ONLY valid JSON:
{
  "setup_quality": 0-100,
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "confidence": 0-1,
  "strategy": "breakout/trend-following/reversal",
  "risk_level": "low/medium/high",
  "timeframe": "scalp/day/swing",
  "catalysts": ["list", "of", "reasons"],
  "reasoning": "why this is a good trade TODAY",
  "risk_reward": number
}`
        }],
        tools: [{ ...WEB_SEARCH_TOOL, max_uses: 3 } as any]
      })

      const textContent = response.content.find(block => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        return null
      }

      const analysis = JSON.parse(textContent.text)

      return {
        asset: asset.symbol,
        market: asset.market,
        ...analysis
      }
    } catch (error) {
      console.error(`Error analyzing ${asset.symbol}:`, error)
      return null
    }
  }

  private rankOpportunities(opportunities: any[]): TradingOpportunity[] {
    return opportunities
      .map((opp, index) => ({
        rank: index + 1,
        asset: opp.asset,
        market: opp.market,
        score: this.calculateScore(opp),
        setup_quality: opp.setup_quality,
        confidence: opp.confidence,
        trade_setup: {
          entry: opp.entry_price,
          stop_loss: opp.stop_loss,
          take_profit: opp.take_profit,
          risk_reward: opp.risk_reward,
          position_size: '2% of portfolio'
        },
        strategy: opp.strategy,
        timeframe: opp.timeframe,
        risk_level: opp.risk_level,
        catalysts: opp.catalysts || [],
        reasoning: opp.reasoning,
        news_sources: []
      }))
      .sort((a, b) => b.score - a.score)
      .map((opp, index) => ({ ...opp, rank: index + 1 }))
  }

  private calculateScore(opp: any): number {
    return (
      opp.setup_quality * 0.30 +
      opp.confidence * 100 * 0.25 +
      (opp.risk_level === 'low' ? 20 : opp.risk_level === 'medium' ? 15 : 10) +
      (opp.risk_reward * 10)
    )
  }
}

export const marketScanner = new AIMarketScanner()

