// Ensemble API Endpoint
// Parallel predictions from 4 models with weighted voting

import { NextRequest, NextResponse } from 'next/server';
import { calculateAllIndicators } from '@/lib/analysis/technical-indicators';
import { getOpenRouterClient } from '@/lib/ai/openrouter';
import { calculateEnsemble, detectStrongDisagreement } from '@/lib/ai/ensemble';
import { generateTradingSignal } from '@/lib/ai/signal-generator';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { symbol, timeframe, candles, newsContext } = body;

    console.log(`🤖 Ensemble API called for ${symbol} ${timeframe}`);

    // Validation
    if (!symbol || !timeframe || !candles || candles.length < 200) {
      return NextResponse.json(
        { error: 'Missing required fields or insufficient candles (need 200+)' },
        { status: 400 }
      );
    }

    // Step 1: Calculate technical indicators
    console.log('📊 Calculating technical indicators...');
    const analysis = calculateAllIndicators(candles, symbol, timeframe);

    // Step 2: Get predictions from all 4 models in parallel
    console.log('🧠 Calling 4 AI models in parallel...');
    const openRouter = getOpenRouterClient();
    const predictions = await openRouter.getAllPredictions(
      analysis,
      candles,
      newsContext
    );

    console.log('✅ Received predictions from all models');

    // Step 3: Calculate ensemble result
    console.log('🎯 Calculating ensemble...');
    const ensemble = calculateEnsemble(predictions);

    // Step 4: Detect strong disagreement
    const hasDisagreement = detectStrongDisagreement(predictions);
    if (hasDisagreement) {
      console.log('⚠️ Strong disagreement detected among models');
    }

    // Step 5: Generate trading signal
    console.log('📈 Generating trading signal...');
    const signal = generateTradingSignal(ensemble, analysis, timeframe);

    // Step 6: Save prediction to database for accuracy tracking
    try {
      const predictionRecord = await prisma.ensemblePrediction.create({
        data: {
          symbol,
          timeframe,
          signal: signal.signal,
          confidence: signal.confidence,
          agreement: signal.agreement,
          
          // Individual model predictions
          sonnetSignal: predictions[0]?.signal || 'HOLD',
          sonnetConfidence: predictions[0]?.confidence || 0,
          deepseekSignal: predictions[1]?.signal || 'HOLD',
          deepseekConfidence: predictions[1]?.confidence || 0,
          nemotronSignal: predictions[2]?.signal || 'HOLD',
          nemotronConfidence: predictions[2]?.confidence || 0,
          geminiSignal: predictions[3]?.signal || 'HOLD',
          geminiConfidence: predictions[3]?.confidence || 0,
          
          // Trading levels
          entryPrice: signal.entry,
          stopLoss: signal.stopLoss,
          takeProfit1: signal.takeProfit[0],
          takeProfit2: signal.takeProfit[1] || null,
          riskReward: signal.riskReward,
          
          // Metadata
          tradeType: signal.tradeType,
          reasoning: signal.reasoning as any,
          warnings: signal.warnings as any,
          
          outcome: 'PENDING',
        },
      });

      console.log(`💾 Saved prediction ${predictionRecord.id} to database`);
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Continue even if DB save fails
    }

    // Step 7: Calculate response time
    const responseTime = Date.now() - startTime;
    console.log(`✅ Ensemble complete in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      signal,
      ensemble: {
        ...ensemble,
        performanceMetrics: {
          responseTime,
          modelsSucceeded: predictions.filter((p) => p.confidence > 0).length,
          modelsFailed: predictions.filter((p) => p.confidence === 0).length,
        },
      },
      analysis: {
        trend: analysis.trend,
        momentum: analysis.momentum,
        volume: analysis.volume,
        supportResistance: analysis.supportResistance,
      },
    });
  } catch (error: any) {
    console.error('Ensemble API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate ensemble prediction',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve historical predictions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (symbol) where.symbol = symbol;
    if (timeframe) where.timeframe = timeframe;

    const predictions = await prisma.ensemblePrediction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Calculate win rate stats
    const completed = predictions.filter((p) => p.outcome !== 'PENDING');
    const wins = completed.filter((p) => p.outcome === 'WIN').length;
    const losses = completed.filter((p) => p.outcome === 'LOSS').length;
    const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0;

    // Calculate win rates by timeframe
    const last24h = predictions.filter(
      (p) => new Date(p.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    const last7d = predictions.filter(
      (p) => new Date(p.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const last30d = predictions.filter(
      (p) => new Date(p.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const calculateWinRate = (preds: typeof predictions) => {
      const done = preds.filter((p) => p.outcome !== 'PENDING');
      const w = done.filter((p) => p.outcome === 'WIN').length;
      return done.length > 0 ? Math.round((w / done.length) * 100) : 0;
    };

    return NextResponse.json({
      success: true,
      predictions,
      stats: {
        total: predictions.length,
        wins,
        losses,
        pending: predictions.length - completed.length,
        winRate: Math.round(winRate),
        avgConfidence:
          predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length || 0,
      },
      winRateHistory: {
        last24h: calculateWinRate(last24h),
        last7d: calculateWinRate(last7d),
        last30d: calculateWinRate(last30d),
      },
    });
  } catch (error: any) {
    console.error('GET ensemble error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

