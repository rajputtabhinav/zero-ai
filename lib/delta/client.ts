import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'

export interface Candle {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Product {
  id: number
  symbol: string
  description: string
  contract_type: string
  product_type: string
  settlement_time: string | null
  underlying_asset: {
    symbol: string
  }
  quoting_asset: {
    symbol: string
  }
}

export interface Quote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
}

export interface SearchResult {
  symbol: string
  name: string
  market: string
}

export class DeltaExchangeClient {
  private baseURL: string
  private apiKey: string
  private apiSecret: string
  private client: AxiosInstance

  constructor() {
    this.baseURL = process.env.DELTA_API_URL || 'https://api.delta.exchange'
    this.apiKey = process.env.DELTA_API_KEY || ''
    this.apiSecret = process.env.DELTA_API_SECRET || ''

    if (!this.apiKey || !this.apiSecret) {
      console.error('❌ DELTA_API_KEY or DELTA_API_SECRET not found in environment variables!')
      console.error('Please add to .env.local')
    } else {
      console.log(`✅ Delta Exchange API initialized with key: ${this.apiKey.substring(0, 10)}...`)
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    })
  }

  /**
   * Generate authentication signature for Delta Exchange API
   */
  private generateSignature(method: string, path: string, timestamp: number, body: string = ''): string {
    const message = method + timestamp + path + body
    return crypto.createHmac('sha256', this.apiSecret).update(message).digest('hex')
  }

  /**
   * Add authentication headers to request
   */
  private getAuthHeaders(method: string, path: string, body: any = null): Record<string, string> {
    const timestamp = Date.now()
    const bodyString = body ? JSON.stringify(body) : ''
    const signature = this.generateSignature(method, path, timestamp, bodyString)

    return {
      'api-key': this.apiKey,
      'timestamp': timestamp.toString(),
      'signature': signature,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Get all available products (trading pairs)
   */
  async getProducts(): Promise<Product[]> {
    try {
      console.log('[Delta] Fetching available products...')
      
      const response = await this.client.get('/v2/products')
      
      if (response.data.success && response.data.result) {
        const products = response.data.result as Product[]
        console.log(`[Delta] ✅ Fetched ${products.length} products`)
        return products
      }
      
      console.warn('[Delta] No products found')
      return []
    } catch (error: any) {
      console.error('[Delta] Error fetching products:', error.message)
      if (error.response) {
        console.error('[Delta] Response:', error.response.data)
      }
      return []
    }
  }

  /**
   * Get candlestick data (OHLCV)
   * @param symbol - Product symbol (e.g., 'BTCUSDT')
   * @param resolution - Timeframe: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 1d, 1w
   * @param start - Start time (Date object)
   * @param end - End time (Date object)
   */
  async getCandles(
    symbol: string,
    resolution: string = '1h',
    start?: Date,
    end?: Date
  ): Promise<Candle[]> {
    try {
      // Default to last 7 days if not specified
      const endTime = end ? Math.floor(end.getTime() / 1000) : Math.floor(Date.now() / 1000)
      const startTime = start 
        ? Math.floor(start.getTime() / 1000) 
        : endTime - (7 * 24 * 60 * 60)
      
      // Map timeframe to Delta Exchange format
      const resolutionMap: Record<string, string> = {
        '1m': '1m',
        '3m': '3m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1H': '1h',
        '2H': '2h',
        '4H': '4h',
        '6H': '6h',
        '1D': '1d',
        '1W': '1w'
      }
      
      const deltaResolution = resolutionMap[resolution] || resolution
      
      console.log(`[Delta] Fetching candles for ${symbol}, resolution: ${deltaResolution}`)
      console.log(`[Delta] Time range: ${new Date(startTime * 1000).toLocaleString()} to ${new Date(endTime * 1000).toLocaleString()}`)
      
      const response = await this.client.get('/v2/history/candles', {
        params: {
          symbol: symbol,
          resolution: deltaResolution,
          start: startTime,
          end: endTime
        }
      })
      
      if (!response.data.success || !response.data.result || response.data.result.length === 0) {
        console.warn(`[Delta] No candles found for ${symbol}`)
        return []
      }
      
      // Transform Delta Exchange format to our format
      const candles: Candle[] = response.data.result.map((candle: any) => ({
        timestamp: new Date(candle.time * 1000).toISOString(),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume || 0)
      }))
      
      console.log(`[Delta] ✅ Fetched ${candles.length} candles`)
      return candles
      
    } catch (error: any) {
      console.error('[Delta] Error fetching candles:', error.message)
      if (error.response) {
        console.error('[Delta] Response status:', error.response.status)
        console.error('[Delta] Response data:', error.response.data)
      }
      throw new Error(`Failed to fetch candles: ${error.message}`)
    }
  }

  /**
   * Get real-time ticker data
   */
  async getTicker(symbol: string): Promise<Quote | null> {
    try {
      console.log(`[Delta] Fetching ticker for ${symbol}`)
      
      const response = await this.client.get(`/v2/tickers/${symbol}`)
      
      if (response.data.success && response.data.result) {
        const ticker = response.data.result
        
        const quote: Quote = {
          symbol: ticker.symbol,
          price: parseFloat(ticker.close || ticker.mark_price || 0),
          change: parseFloat(ticker.price_change || 0),
          changePercent: parseFloat(ticker.price_change_percent || 0),
          volume: parseFloat(ticker.volume || 0),
          timestamp: new Date().toISOString()
        }
        
        console.log(`[Delta] ✅ Ticker: ${quote.symbol} @ $${quote.price}`)
        return quote
      }
      
      console.warn(`[Delta] No ticker found for ${symbol}`)
      return null
    } catch (error: any) {
      console.error('[Delta] Error fetching ticker:', error.message)
      if (error.response) {
        console.error('[Delta] Response:', error.response.data)
      }
      return null
    }
  }

  /**
   * Search for symbols
   */
  async searchSymbols(query: string): Promise<SearchResult[]> {
    try {
      console.log(`[Delta] Searching for: ${query}`)
      
      const products = await this.getProducts()
      
      const results = products
        .filter((p: Product) => 
          p.symbol.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          p.underlying_asset?.symbol.toLowerCase().includes(query.toLowerCase())
        )
        .map((p: Product) => ({
          symbol: p.symbol,
          name: p.description || p.symbol,
          market: 'crypto'
        }))
        .slice(0, 20) // Limit to 20 results
      
      console.log(`[Delta] ✅ Found ${results.length} results`)
      return results
    } catch (error: any) {
      console.error('[Delta] Error searching symbols:', error.message)
      return []
    }
  }

  /**
   * Get spot products only (filter out futures/perpetuals)
   */
  async getSpotProducts(): Promise<Product[]> {
    try {
      const allProducts = await this.getProducts()
      
      // Filter for spot products (perpetuals have USDT in symbol)
      const spotProducts = allProducts.filter((p: Product) => 
        p.symbol.includes('USDT') && 
        p.contract_type === 'perpetual_futures'
      )
      
      console.log(`[Delta] ✅ Found ${spotProducts.length} perpetual futures`)
      return spotProducts
    } catch (error: any) {
      console.error('[Delta] Error fetching spot products:', error.message)
      return []
    }
  }
}

// Export singleton instance
export const deltaClient = new DeltaExchangeClient()

