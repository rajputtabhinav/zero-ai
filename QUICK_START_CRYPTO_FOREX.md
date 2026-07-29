# Quick Start Guide - Crypto & Forex AI Predictions

## 🚀 Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 💎 Using Crypto Pairs

1. Click **"💎 Crypto ▼"** in the header
2. Select any crypto pair from the grid:
   - **BTC** (Bitcoin)
   - **ETH** (Ethereum)
   - **SOL** (Solana)
   - **BNB** (Binance Coin)
   - ...and 100+ more!
3. Click **"📊 Load"** to fetch historical data
4. Click **"🤖 AI Predict"** to generate predictions

## 💱 Using Forex Pairs

1. Click **"💱 Forex ▼"** in the header
2. Choose from organized categories:
   
   **Major Pairs:**
   - EURUSD (Euro / US Dollar)
   - GBPUSD (British Pound / US Dollar)
   - USDJPY (US Dollar / Japanese Yen)
   - USDCHF (US Dollar / Swiss Franc)
   - AUDUSD (Australian Dollar / US Dollar)
   - USDCAD (US Dollar / Canadian Dollar)
   - NZDUSD (New Zealand Dollar / US Dollar)
   
   **Cross Pairs:**
   - EURJPY, GBPJPY, EURGBP, EURAUD, etc.
   
   **Exotic Pairs:**
   - USDSEK, USDNOK, USDTRY, USDZAR, etc.

3. Click **"📊 Load"** to fetch historical data
4. Click **"🤖 AI Predict"** to generate predictions

## 🤖 AI Prediction Features

When you click "🤖 AI Predict", the AI will:

1. **Analyze Historical Data** - Last 200+ candles
2. **Search Latest News** - Real-time web search for market sentiment
3. **Technical Analysis** - RSI, MACD, Moving Averages
4. **Generate Predictions** - Next 10-20 candles with confidence scores
5. **Trading Signal** - BUY/SELL/HOLD with entry/exit prices

## ⚙️ Timeframe Options

Choose your analysis timeframe:
- **1m, 3m, 5m** - Scalping
- **15m, 30m** - Day trading
- **1H, 2H, 4H** - Swing trading
- **8H, 12H, 1D** - Position trading
- **1W** - Long-term investing

## 📊 Chart Features

- **Interactive** - Hover for candle details
- **Zoom** - Scroll to zoom in/out
- **Pan** - Drag to move left/right
- **Predictions** - Purple overlay shows AI predictions
- **Confidence** - Opacity indicates prediction confidence

## 🔍 Symbol Search

Type in the search box to find any symbol:
- Minimum 3 characters
- Auto-suggestions appear
- Shows symbol name and market type

## 💡 Tips

1. **Load data first** - Always click "📊 Load" before predictions
2. **Wait for 200+ candles** - AI needs sufficient data
3. **Check timeframe** - Match your trading style
4. **Read the signal** - AI provides entry/exit prices
5. **Consider news** - AI includes latest market news

## 🎯 Example Workflow

### Crypto Trading
```
1. Click "💎 Crypto ▼"
2. Select "BTC" (BTCUSD)
3. Choose "5m" timeframe
4. Click "📊 Load"
5. Wait for chart to load
6. Click "🤖 AI Predict"
7. Review trading signal
8. Check predicted candles (purple overlay)
```

### Forex Trading
```
1. Click "💱 Forex ▼"
2. Select "EURUSD" from Major Pairs
3. Choose "1H" timeframe
4. Click "📊 Load"
5. Wait for chart to load
6. Click "🤖 AI Predict"
7. Review trading signal
8. Check predicted candles (purple overlay)
```

## 📈 Understanding the Trading Signal

The AI signal card shows:

- **Signal**: BUY, SELL, or HOLD
- **Confidence**: 0-100% (higher is better)
- **Entry Price**: Where to enter the trade
- **Stop Loss**: Where to exit if wrong
- **Take Profit**: Target prices (multiple levels)
- **Risk/Reward**: Expected return vs risk
- **Reasoning**: Why the AI made this decision

## ⚠️ Important Notes

- **Not Financial Advice** - AI predictions are for educational purposes
- **Historical Data** - Uses past 7 days by default
- **Caching** - Data cached for 5 minutes (faster reloads)
- **Rate Limits** - Massive.com API has rate limits
- **Internet Required** - AI uses web search for news

## 🛠️ Troubleshooting

**No data loading?**
- Check your Massive.com API key in `.env.local`
- Verify the symbol is correct
- Try a different timeframe

**AI prediction fails?**
- Ensure you have 200+ candles loaded
- Check Anthropic API key in `.env.local`
- Wait a moment and try again

**Chart not showing?**
- Refresh the page
- Check browser console for errors
- Try a different symbol

## 🎨 UI Elements

- **Green ● LIVE** - Data is fresh
- **Yellow ● DELAYED** - Data is 15+ minutes old
- **Red ● STALE** - Data is 1+ hour old
- **Clock 🕐** - Current time display
- **Candle count** - Number of candles loaded

## 🚀 Next Steps

1. Explore different crypto pairs
2. Try various forex pairs
3. Compare different timeframes
4. Analyze AI predictions vs actual price
5. Use signals for paper trading practice

## 📚 Resources

- **Crypto Pairs**: 100+ available (BTC, ETH, SOL, etc.)
- **Forex Pairs**: 40+ available (EUR, GBP, JPY, etc.)
- **Timeframes**: 1m to 1W
- **AI Model**: Claude Sonnet 4.5 with web search
- **Data Source**: Massive.com API

---

**Happy Trading! 🎉**

Remember: This is an AI prediction tool for learning and analysis. Always do your own research and never risk more than you can afford to lose.

