# Zero.AI Setup Guide

Welcome to Zero.AI! This guide will help you set up and run the platform.

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL** database running
- **Redis** server running
- **Massive.com API** credentials (Access Key + Secret Key)
- **Anthropic API** key for Claude Sonnet 4.5

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

The `.env.local` file should already exist with your credentials. Verify it contains:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zeroai_db
REDIS_URL=redis://localhost:6379

# Massive.com API
MASSIVE_ACCESS_KEY_ID=b8b719e6-222c-42fe-beb2-dbb6e0c1a599
MASSIVE_SECRET_ACCESS_KEY=pAwM2V2SuJqFepuJEYifphap0nJS1TFb
MASSIVE_API_ENDPOINT=https://api.massive.com
MASSIVE_S3_ENDPOINT=https://files.massive.com
MASSIVE_S3_BUCKET=flatfiles

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-api03-REDACTED-ROTATE-THIS-KEY

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here_change_in_production
NEXTAUTH_URL=http://localhost:3000

# WebSocket
WEBSOCKET_SERVER_URL=ws://localhost:8080
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

### 5. Start WebSocket Server (Optional - for real-time data)

In a separate terminal:

```bash
npm run ws-server
```

Or run both at once:

```bash
npm run dev:all
```

## Features

### 1. Homepage
- Visit **http://localhost:3000** to see the welcome page
- Overview of all platform features
- Links to main features

### 2. AI-Powered Charting
- Visit **http://localhost:3000/chart**
- Enter a symbol (e.g., BTC/USD, AAPL)
- Click "Load Chart" to view historical data
- Click "Generate AI Predictions" to see future candles
- Real-time predictions with confidence scores

### 3. AI Market Scanner
- Visit **http://localhost:3000/ai-scanner**
- Click "Find Best Trades Today"
- AI will scan markets and return TOP 10 opportunities
- Each opportunity includes:
  - Entry, stop-loss, and take-profit levels
  - Risk/reward ratio
  - Trading strategy
  - News catalysts
  - AI confidence score

## API Endpoints

### Market Data
- `GET /api/massive/candles?symbol=BTC/USD&timeframe=1H&limit=200`
- `GET /api/massive/quote?symbol=AAPL`
- `GET /api/massive/search?q=bitcoin&market=crypto`

### AI Features
- `POST /api/ai/predict` - Generate price predictions
- `POST /api/ai/scan-market` - Find best trading opportunities

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
# Update DATABASE_URL in .env.local with correct credentials
npx prisma db push
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping
# Should return "PONG"
```

### API Key Issues
- Verify Massive.com API key is active
- Verify Anthropic API key has sufficient credits
- Check API endpoints are correct

### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

## Development Tips

### View Database
```bash
npx prisma studio
```

### Check API Logs
Check terminal output for API errors and WebSocket connections

### Test AI Features
- AI predictions work best with liquid assets (BTC, ETH, major stocks)
- Market scanner takes 20-30 seconds (searches web + analyzes data)
- Predictions are cached for 5 minutes to save API costs

## Production Deployment

### 1. Update Environment Variables
- Change `NEXTAUTH_SECRET` to a strong random string
- Update `NEXTAUTH_URL` to your production domain
- Use production database URLs

### 2. Build
```bash
npm run build
```

### 3. Start Production Server
```bash
npm start
```

### 4. Deploy
- **Vercel**: Connect GitHub repo, environment variables auto-configured
- **AWS/DigitalOcean**: Use PM2 or Docker for process management
- **Database**: Use managed PostgreSQL (AWS RDS, DigitalOcean, Supabase)
- **Redis**: Use managed Redis (AWS ElastiCache, Redis Cloud)

## Cost Estimates

### API Usage (per 1000 predictions)
- Anthropic Claude: ~$3-5
- Massive.com data: ~$1-2
- **Total**: ~$4-7 per 1000 predictions

### Optimization Tips
- Enable caching (already implemented)
- Use prediction confidence filters
- Limit market scanner to popular assets
- Batch API requests

## Support

For issues or questions:
1. Check the README.md for general information
2. Review console logs for errors
3. Verify all environment variables are set
4. Ensure PostgreSQL and Redis are running

## Next Steps

After basic setup, explore:
- Paper trading system (coming soon)
- Backtesting engine (coming soon)
- Social features (coming soon)
- Authentication system (coming soon)

---

**Built with ❤️ using Claude Sonnet 4.5**

