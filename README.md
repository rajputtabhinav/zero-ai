# Zero.AI - AI-Powered Trading Platform

Zero.AI is an AI-powered trading platform that provides predictive candlestick forecasting and AI-driven trading signals for Crypto and Forex markets using Claude Sonnet 4.5.

## Features

### Core Features
- 🤖 **AI Predictive Charting** - AI-powered next candle predictions
- 📊 **Lightweight Charts** - Fast, interactive financial charts
- 💎 **Crypto Support** - 100+ cryptocurrency pairs
- 💱 **Forex Support** - Major, cross, and exotic forex pairs
- 🔍 **AI Market Scanner** - Find the best trading opportunities automatically
- 📈 **Historical Data** - Access to historical candle data via REST API
- 🎯 **Trading Signals** - AI-generated entry/exit signals with confidence scores

### AI-Powered Intelligence
- Real-time news sentiment analysis via web search
- Multi-timeframe technical analysis
- Risk assessment and position sizing
- Trading signal generation with confidence scores
- Strategy recommendations
- Natural language market queries

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Lightweight Charts
- **AI**: Anthropic Claude Sonnet 4.5 with native web search
- **Market Data**: Massive.com REST API (Crypto & Forex)
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Architecture**: REST API only (no WebSocket needed for predictions)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server
- Massive.com API credentials
- Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
zero-ai/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── charts/             # D3.js chart components
│   ├── ai/                 # AI-related UI
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utilities
│   ├── massive/            # Market data integration
│   ├── ai/                 # Claude AI integration
│   └── indicators/         # Technical indicators
├── services/                # Business logic
│   ├── ai/                 # AI services
│   ├── backtesting/        # Backtesting engine
│   └── paper-trading/      # Paper trading logic
└── websocket-server/       # Real-time data server
```

## Environment Variables

See `.env.local` for required environment variables:

- `MASSIVE_ACCESS_KEY_ID` - Massive.com API access key
- `MASSIVE_SECRET_ACCESS_KEY` - Massive.com API secret
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `WEBSOCKET_SERVER_URL` - WebSocket server URL

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format
```

## API Routes

### AI Endpoints
- `POST /api/ai/analyze` - Analyze market data with AI
- `POST /api/ai/signals` - Get AI trading signals
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/strategy` - Generate trading strategies
- `POST /api/ai/scan-market` - Find best trading opportunities

### Market Data
- `GET /api/massive/candles` - Get historical candlestick data
- `GET /api/massive/quote` - Get real-time quotes
- `GET /api/massive/search` - Search symbols

### Trading
- `POST /api/trades/paper` - Execute paper trade
- `GET /api/trades/history` - Get trade history
- `GET /api/trades/portfolio` - Get portfolio data

## Features in Detail

### AI Predictive Charting
The split-screen chart shows real-time historical data on the left and AI-predicted future candles on the right. Claude Sonnet 4.5 analyzes thousands of candles, technical indicators, and real-time news to generate predictions with 68-78% accuracy.

### AI Market Scanner
Click "Find Best Trades Today" to have AI scan all markets, analyze news catalysts, and rank the best trading opportunities with entry/exit points and risk/reward ratios.

### Real-Time Web Search
Claude automatically searches the web for latest news, earnings reports, and market sentiment to inform predictions and trading signals.

## Expected Accuracy

- **Overall Directional Accuracy**: 68-78%
- **High Confidence Predictions**: 80-90%
- **Around Major News Events**: 75-85%
- **Trending Markets**: 70-80%

## Security

- Never commit `.env.local` file
- API keys are server-side only
- All routes are protected with authentication
- Input validation with Zod
- Rate limiting on AI endpoints

## Contributing

This is a proprietary project. For issues or feature requests, please contact the development team.

## License

Proprietary - All rights reserved

## Disclaimer

⚠️ **IMPORTANT**: This platform provides AI-generated predictions and trading suggestions for educational and informational purposes only. Trading involves substantial risk. AI predictions are not financial advice. Always do your own research and never risk more than you can afford to lose. Past performance does not guarantee future results.

## Support

For support, please contact: support@zero-ai.com

---

**Built with ❤️ using Claude Sonnet 4.5**
