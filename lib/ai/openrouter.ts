// OpenRouter Client for 4-Model Ensemble
// Supports Claude Sonnet 4.5, DeepSeek R1, NVIDIA Nemotron-4, Qwen 2.5

import OpenAI from 'openai';
import type { TechnicalAnalysis } from '../analysis/technical-indicators';

export type ModelName = 'sonnet' | 'deepseek' | 'nemotron' | 'qwen';

export interface ModelPrediction {
  model: ModelName;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reasoning: string;
  nextCandles: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    time: number;
  }>;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number[];
}

// Model configurations - Equal voting power (democratic)
const MODELS = {
  sonnet: {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4.5',
    weight: 1.0, // Equal vote
    specialty: 'News sentiment, market narrative, complex patterns',
  },
  deepseek: {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    weight: 1.0, // Equal vote
    specialty: 'Multi-step reasoning, indicator correlation',
  },
  nemotron: {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'NVIDIA Nemotron 70B',
    weight: 1.0, // Equal vote
    specialty: 'Volume flow analysis, structured data',
  },
  qwen: {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    weight: 1.0, // Equal vote
    specialty: 'Technical analysis, price action patterns',
  },
};

class OpenRouterClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Zero.AI Trading Platform',
      },
    });
  }

  /**
   * Get prediction from Claude Sonnet 4.5
   * Best at: News sentiment + market narrative
   */
  async getSonnetPrediction(
    analysis: TechnicalAnalysis,
    candles: any[],
    newsContext?: string
  ): Promise<ModelPrediction> {
    const prompt = `You are a professional trader analyzing ${analysis.symbol} on ${analysis.timeframe} timeframe.

TECHNICAL ANALYSIS:
${JSON.stringify(analysis, null, 2)}

RECENT NEWS & SENTIMENT:
${newsContext || 'No recent news available'}

TASK: Predict the next 10 candles and provide a trading signal.

Consider:
1. Indicator confluence (are multiple indicators agreeing?)
2. News sentiment impact on price action
3. Market structure (uptrend/downtrend/ranging)
4. Volume confirmation of the move
5. Risk/reward at current price levels

Return ONLY valid JSON (no markdown, no code blocks):
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reasoning": "Brief explanation of your analysis",
  "nextCandles": [
    {"open": 95240, "high": 95500, "low": 95100, "close": 95400, "time": timestamp},
    ...10 candles total
  ],
  "entry": price_number,
  "stopLoss": price_number,
  "takeProfit": [tp1_number, tp2_number]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: MODELS.sonnet.id,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = this.parseResponse(content);

      return {
        model: 'sonnet',
        ...parsed,
      };
    } catch (error) {
      console.error('Sonnet prediction error:', error);
      return this.getFallbackPrediction('sonnet', analysis);
    }
  }

  /**
   * Get prediction from DeepSeek R1
   * Best at: Deep reasoning + multi-step logic
   */
  async getDeepSeekPrediction(
    analysis: TechnicalAnalysis,
    candles: any[]
  ): Promise<ModelPrediction> {
    const prompt = `Analyze this trading setup using step-by-step reasoning:

TECHNICAL INDICATORS:
- RSI: ${analysis.momentum.rsi.value.toFixed(1)} (${analysis.momentum.rsi.signal})
- MACD: ${analysis.trend.macd.crossover} crossover
- ADX: ${analysis.trend.adx.value.toFixed(1)} (${analysis.trend.strength} trend)
- Volume: ${(analysis.volume.volumeRatio * 100 - 100).toFixed(0)}% vs average
- EMA: ${analysis.trend.ema.alignment}
- Bollinger: Price at ${(analysis.volatility.bollingerBands.percentB * 100).toFixed(0)}% of range
- Support: ${analysis.supportResistance.nearestSupport}
- Resistance: ${analysis.supportResistance.nearestResistance}

STEP-BY-STEP ANALYSIS:
1. What is the primary trend? (Check ADX + EMA alignment)
2. Is momentum confirming the trend? (RSI + MACD)
3. Is volume supporting the move? (OBV + Volume ratio)
4. What are the key price levels? (Support/Resistance)
5. What's the risk/reward ratio for a trade?
6. What could invalidate this setup?
7. FINAL SIGNAL: BUY/SELL/HOLD with confidence

Show your reasoning for each step, then return ONLY valid JSON:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reasoning": "Logical step-by-step explanation",
  "nextCandles": [...10 predicted candles...],
  "entry": number,
  "stopLoss": number,
  "takeProfit": [number, number]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: MODELS.deepseek.id,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = this.parseResponse(content);

      return {
        model: 'deepseek',
        ...parsed,
      };
    } catch (error) {
      console.error('DeepSeek prediction error:', error);
      return this.getFallbackPrediction('deepseek', analysis);
    }
  }

  /**
   * Get prediction from NVIDIA Nemotron
   * Best at: Volume analysis + order flow
   */
  async getNemotronPrediction(
    analysis: TechnicalAnalysis,
    candles: any[]
  ): Promise<ModelPrediction> {
    const prompt = `Analyze ${analysis.symbol} volume profile and market microstructure:

VOLUME DATA:
- Current: ${analysis.volume.current.toFixed(0)} (vs avg ${analysis.volume.average20.toFixed(0)} = ${((analysis.volume.volumeRatio - 1) * 100).toFixed(0)}%)
- OBV: ${analysis.volume.obvTrend} (${analysis.volume.obvTrend === 'RISING' ? 'accumulation' : 'distribution'})
- VWAP: $${analysis.volume.vwap.toFixed(2)} (price ${analysis.volume.priceVsVwap} = ${analysis.volume.priceVsVwap === 'ABOVE' ? 'bullish' : 'bearish'})
- Summary: ${analysis.volume.summary}

PRICE ACTION:
- Current: $${analysis.price.current.toFixed(2)}
- 24h Change: ${analysis.price.change24h.toFixed(2)}%
- ATR: ${analysis.volatility.atr.toFixed(2)} (${analysis.volatility.atrPercent.toFixed(2)}%)
- Market Structure: ${analysis.marketStructure.structure}

Based on volume analysis, predict:
1. Is this accumulation or distribution?
2. Where are institutional players positioned?
3. What's the likely next move based on volume confirmation?

Return ONLY valid JSON:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reasoning": "Volume-focused analysis",
  "nextCandles": [...10 candles...],
  "entry": number,
  "stopLoss": number,
  "takeProfit": [number, number]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: MODELS.nemotron.id,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = this.parseResponse(content);

      return {
        model: 'nemotron',
        ...parsed,
      };
    } catch (error) {
      console.error('Nemotron prediction error:', error);
      return this.getFallbackPrediction('nemotron', analysis);
    }
  }

  /**
   * Get prediction from Qwen 2.5
   * Best at: Technical analysis + price action patterns
   */
  async getQwenPrediction(
    analysis: TechnicalAnalysis,
    candles: any[]
  ): Promise<ModelPrediction> {
    const prompt = `Technical analysis of ${analysis.symbol} ${analysis.timeframe} using price action:

INDICATORS SNAPSHOT:
- Trend: ${analysis.trend.direction} (${analysis.trend.strength})
- RSI: ${analysis.momentum.rsi.value.toFixed(0)} | MACD: ${analysis.trend.macd.crossover}
- ADX: ${analysis.trend.adx.value.toFixed(0)} | Volume: ${analysis.volume.volumeRatio > 1.2 ? 'High' : 'Normal'}
- EMA: ${analysis.trend.ema.alignment}
- Price vs VWAP: ${analysis.volume.priceVsVwap}

CANDLESTICK PATTERNS:
${analysis.patterns.candlestick.map(p => `- ${p.name} (${(p.confidence * 100).toFixed(0)}%)`).join('\n')}

MARKET STRUCTURE:
- ${analysis.marketStructure.structure}
- Higher highs: ${analysis.marketStructure.higherHighs ? 'Yes' : 'No'}
- Higher lows: ${analysis.marketStructure.higherLows ? 'Yes' : 'No'}

PRICE LEVELS:
- Current: $${analysis.price.current.toFixed(2)}
- Support: $${analysis.supportResistance.nearestSupport}
- Resistance: $${analysis.supportResistance.nearestResistance}

Focus on pure price action and technical patterns. Return ONLY valid JSON:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reasoning": "Price action based analysis",
  "nextCandles": [...10 candles...],
  "entry": number,
  "stopLoss": number,
  "takeProfit": [number, number]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: MODELS.qwen.id,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = this.parseResponse(content);

      return {
        model: 'qwen',
        ...parsed,
      };
    } catch (error) {
      console.error('Qwen prediction error:', error);
      return this.getFallbackPrediction('qwen', analysis);
    }
  }

  /**
   * Get predictions from all 4 models in parallel
   */
  async getAllPredictions(
    analysis: TechnicalAnalysis,
    candles: any[],
    newsContext?: string
  ): Promise<ModelPrediction[]> {
    console.log(`🤖 Calling 4 models in parallel for ${analysis.symbol}...`);

    const [sonnet, deepseek, nemotron, qwen] = await Promise.all([
      this.getSonnetPrediction(analysis, candles, newsContext),
      this.getDeepSeekPrediction(analysis, candles),
      this.getNemotronPrediction(analysis, candles),
      this.getQwenPrediction(analysis, candles),
    ]);

    return [sonnet, deepseek, nemotron, qwen];
  }

  /**
   * Parse AI response, handling various formats
   */
  private parseResponse(content: string): Omit<ModelPrediction, 'model'> {
    try {
      // Remove markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
      }

      const parsed = JSON.parse(jsonStr);

      return {
        signal: parsed.signal || 'HOLD',
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        reasoning: parsed.reasoning || 'Analysis completed',
        nextCandles: parsed.nextCandles || [],
        entry: parsed.entry,
        stopLoss: parsed.stopLoss,
        takeProfit: parsed.takeProfit || [],
      };
    } catch (error) {
      console.error('Parse error:', error);
      return {
        signal: 'HOLD',
        confidence: 50,
        reasoning: 'Unable to parse model response',
        nextCandles: [],
      };
    }
  }

  /**
   * Fallback prediction when model fails
   */
  private getFallbackPrediction(
    model: ModelName,
    analysis: TechnicalAnalysis
  ): ModelPrediction {
    return {
      model,
      signal: analysis.overallSignal === 'BULLISH' ? 'BUY' : analysis.overallSignal === 'BEARISH' ? 'SELL' : 'HOLD',
      confidence: Math.max(30, analysis.confidence - 20),
      reasoning: `Fallback: Based on technical analysis (${analysis.overallSignal})`,
      nextCandles: [],
      entry: analysis.price.current,
      stopLoss: analysis.supportResistance.nearestSupport,
      takeProfit: [analysis.supportResistance.nearestResistance],
    };
  }
}

// Singleton instance
let openRouterClient: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!openRouterClient) {
    openRouterClient = new OpenRouterClient();
  }
  return openRouterClient;
}

export { MODELS };

