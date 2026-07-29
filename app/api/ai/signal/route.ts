// Trading Signal API Endpoint
// Quick signal generation (uses cached predictions when available)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '1H';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    // Get latest prediction from database
    const latestPrediction = await prisma.ensemblePrediction.findFirst({
      where: {
        symbol,
        timeframe,
        outcome: 'PENDING', // Only active signals
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestPrediction) {
      return NextResponse.json({
        success: false,
        message: 'No active signal found. Generate a new prediction first.',
      });
    }

    // Check if prediction is recent (< 1 hour old)
    const ageMinutes =
      (Date.now() - new Date(latestPrediction.createdAt).getTime()) / (1000 * 60);

    if (ageMinutes > 60) {
      return NextResponse.json({
        success: false,
        message: 'Signal is outdated. Generate a new prediction.',
        age: `${Math.round(ageMinutes)} minutes old`,
      });
    }

    // Format as trading signal
    const signal = {
      signal: latestPrediction.signal,
      symbol: latestPrediction.symbol,
      timeframe: latestPrediction.timeframe,
      confidence: latestPrediction.confidence,
      agreement: latestPrediction.agreement,
      entry: latestPrediction.entryPrice,
      stopLoss: latestPrediction.stopLoss,
      takeProfit: [
        latestPrediction.takeProfit1,
        latestPrediction.takeProfit2 || latestPrediction.takeProfit1,
      ],
      riskReward: latestPrediction.riskReward,
      tradeType: latestPrediction.tradeType,
      reasoning: latestPrediction.reasoning,
      warnings: latestPrediction.warnings || [],
      timestamp: latestPrediction.createdAt,
      age: `${Math.round(ageMinutes)} minutes ago`,
    };

    return NextResponse.json({
      success: true,
      signal,
    });
  } catch (error: any) {
    console.error('Signal API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST endpoint to update signal outcome
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { predictionId, outcome, actualExitPrice, actualPnL } = body;

    if (!predictionId || !outcome) {
      return NextResponse.json(
        { error: 'predictionId and outcome required' },
        { status: 400 }
      );
    }

    // Update prediction
    const updated = await prisma.ensemblePrediction.update({
      where: { id: predictionId },
      data: {
        outcome,
        actualExitPrice,
        actualPnL,
        closedAt: new Date(),
      },
    });

    // Update model performance stats
    await updateModelPerformance(updated);

    return NextResponse.json({
      success: true,
      prediction: updated,
    });
  } catch (error: any) {
    console.error('Update signal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to update model performance
async function updateModelPerformance(prediction: any) {
  const models = ['sonnet', 'deepseek', 'nemotron', 'gemini'];
  const periodStart = new Date();
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + 1);

  for (const modelName of models) {
    const modelSignal = prediction[`${modelName}Signal`];
    const modelConfidence = prediction[`${modelName}Confidence`];
    const wasCorrect = modelSignal === prediction.signal && prediction.outcome === 'WIN';

    try {
      await prisma.modelPerformance.upsert({
        where: {
          modelName_symbol_timeframe_periodStart: {
            modelName,
            symbol: prediction.symbol || '',
            timeframe: prediction.timeframe || '',
            periodStart,
          },
        },
        update: {
          totalPredictions: { increment: 1 },
          correctPredictions: { increment: wasCorrect ? 1 : 0 },
          periodEnd,
        },
        create: {
          modelName,
          symbol: prediction.symbol,
          timeframe: prediction.timeframe,
          totalPredictions: 1,
          correctPredictions: wasCorrect ? 1 : 0,
          winRate: 0,
          avgConfidence: modelConfidence,
          avgAccuracy: 0,
          periodStart,
          periodEnd,
        },
      });
    } catch (error) {
      console.error(`Failed to update ${modelName} performance:`, error);
    }
  }
}

