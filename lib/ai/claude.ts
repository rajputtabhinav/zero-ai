import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const claude = anthropic

export const MODEL = 'claude-sonnet-4-5' as const

// Web search tool definition (following official documentation)
// Using 'any' type since web_search_20250305 is not in current SDK types
export const WEB_SEARCH_TOOL: any = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 5,
  allowed_domains: [
    'bloomberg.com',
    'reuters.com',
    'cnbc.com',
    'marketwatch.com',
    'seekingalpha.com',
    'benzinga.com',
    'finance.yahoo.com',
    'wsj.com',
    'ft.com',
    'coindesk.com',
    'cointelegraph.com',
    'cryptoslate.com',
    'investing.com',
    'forexfactory.com'
  ]
}

export interface PredictionResult {
  predictions: Array<{
    timestamp: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    confidence: number
  }>
  scenarios?: {
    bullish: any[]
    realistic: any[]
    bearish: any[]
  }
  key_levels: {
    resistance: number[]
    support: number[]
  }
  reasoning: string
  news_impact?: string
  expected_accuracy: number
}

export async function generatePredictions(
  symbol: string,
  candles: any[],
  indicators: any
): Promise<PredictionResult> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You are an expert trading analyst for Zero.AI platform.

SYMBOL: ${symbol}
CURRENT TIME: ${new Date().toISOString()}

RECENT PRICE DATA (Last 50 candles to save tokens):
${JSON.stringify(candles.slice(-50))}

TECHNICAL INDICATORS:
${JSON.stringify(indicators)}

TASK:
1. Search web for LATEST news about ${symbol} (earnings, announcements, analyst ratings)
2. Check overall market sentiment and economic news
3. Analyze technical patterns in the candle data
4. Combine all information to predict next 10-20 candles

Return ONLY valid JSON (no markdown, no explanation):
{
  "predictions": [
    {"timestamp": "ISO-8601", "open": number, "high": number, "low": number, "close": number, "volume": number, "confidence": 0-1}
  ],
  "reasoning": "Explanation with source citations",
  "news_impact": "positive/negative/neutral",
  "key_levels": {"support": [numbers], "resistance": [numbers]},
  "expected_accuracy": 0-1
}`
      }],
      tools: [WEB_SEARCH_TOOL]
    })

    // Extract JSON from response
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Try to parse JSON, handle code blocks if present
    let jsonText = textContent.text.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    return JSON.parse(jsonText)
  } catch (error: any) {
    console.error('Failed to generate prediction:', error.message)
    throw new Error(`AI prediction failed: ${error.message}`)
  }
}

export async function analyzMarket(symbol: string, data: any): Promise<any> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyze ${symbol} and provide trading insights.

Market Data: ${JSON.stringify(data)}

Search for latest news and provide:
1. Market sentiment (bullish/bearish/neutral)
2. Key support and resistance levels
3. Trading recommendation with confidence score
4. Risk factors

Return JSON format.`
      }],
      tools: [WEB_SEARCH_TOOL]
    })

    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    try {
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(json)?\n/, '').replace(/\n```$/, '')
      }
      return JSON.parse(jsonText)
    } catch (error) {
      return { analysis: textContent.text }
    }
  } catch (error: any) {
    console.error('Market analysis failed:', error.message)
    throw error
  }
}

export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  context?: any
): Promise<string> {
  try {
    const systemMessage = context
      ? `You are a trading assistant for Zero.AI. Current context: ${JSON.stringify(context)}`
      : 'You are a helpful trading assistant for Zero.AI platform.'

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemMessage,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      tools: [WEB_SEARCH_TOOL]
    })

    const textContent = response.content.find(block => block.type === 'text')
    return textContent && textContent.type === 'text' ? textContent.text : ''
  } catch (error: any) {
    console.error('Chat failed:', error.message)
    return 'Sorry, I encountered an error. Please try again.'
  }
}

