# 📚 Polygon.io / Massive.com Official API Documentation

## 🎯 Overview

**Polygon.io is now Massive.com** (as of October 30, 2025)

Both endpoints work during transition:
- ✅ `api.polygon.io` (legacy)
- ✅ `api.massive.com` (new)

---

## 1️⃣ REST API

### Authentication

**Two Methods:**

#### Method 1: Query Parameter
```bash
https://api.massive.com/v2/reference/dividends?apiKey=YOUR_SECRET_KEY
```

#### Method 2: Authorization Header
```bash
curl -H "Authorization: Bearer YOUR_SECRET_KEY" \
  https://api.massive.com/v2/reference/dividends
```

### Response Format

All responses are JSON:
```json
{
  "status": "OK",
  "results": [
    {
      // data objects
    }
  ],
  "count": 1,
  "request_id": "abc123..."
}
```

### Key Endpoints

#### 1. Aggregates (Candles/OHLC)
```
GET /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}
```

**Parameters:**
- `ticker`: Symbol (e.g., `AAPL`, `X:BTCUSD`, `C:EURUSD`)
- `multiplier`: Number (e.g., `1`)
- `timespan`: `minute`, `hour`, `day`, `week`, `month`
- `from`: Date `YYYY-MM-DD`
- `to`: Date `YYYY-MM-DD`
- `limit`: Max results (optional, default varies by plan)

**Example:**
```bash
curl "https://api.massive.com/v2/aggs/ticker/X:BTCUSD/range/1/hour/2024-11-14/2024-11-15?apiKey=YOUR_KEY&limit=1000"
```

**Response:**
```json
{
  "ticker": "X:BTCUSD",
  "status": "OK",
  "resultsCount": 24,
  "results": [
    {
      "t": 1700000000000,  // Unix timestamp (ms)
      "o": 88000.5,        // Open
      "h": 88500.2,        // High
      "l": 87800.1,        // Low
      "c": 88200.3,        // Close
      "v": 1234567.89,     // Volume
      "vw": 88150.4,       // VWAP
      "n": 5432            // Number of transactions
    }
  ]
}
```

#### 2. Last Quote
```
GET /v2/last/nbbo/{ticker}
```

#### 3. Previous Close
```
GET /v2/aggs/ticker/{ticker}/prev
```

#### 4. Ticker Search
```
GET /v3/reference/tickers?search={query}
```

### Symbol Formats

| Asset Class | Format | Example |
|-------------|--------|---------|
| **Stocks** | `TICKER` | `AAPL` |
| **Crypto** | `X:BASE/QUOTE` | `X:BTCUSD` |
| **Forex** | `C:BASE/QUOTE` | `C:EURUSD` |
| **Options** | Complex format | See docs |

### Rate Limits

**Free Tier:**
- 5 API calls per minute
- 16 results per request max
- No WebSocket access

**Developer Tier ($199/mo):**
- 100+ calls per minute
- 50,000 results per request
- WebSocket included

**Advanced Tier ($399/mo):**
- Unlimited calls
- Unlimited results
- Priority support

---

## 2️⃣ WebSocket API

### Connection Endpoints

By Asset Class:
- **Stocks:** `wss://socket.massive.com/stocks`
- **Crypto:** `wss://socket.massive.com/crypto`
- **Forex:** `wss://socket.massive.com/forex`
- **Options:** `wss://socket.massive.com/options`

### Delayed Feed (15-min delay):
- `wss://delayed.massive.com/stocks`
- Note: Crypto delayed feed may not be available

### Connection Flow

#### Step 1: Connect
```javascript
const ws = new WebSocket('wss://socket.massive.com/crypto')
```

**Server Response:**
```json
[{
  "ev": "status",
  "status": "connected",
  "message": "Connected Successfully"
}]
```

#### Step 2: Authenticate
```javascript
ws.send(JSON.stringify({
  "action": "auth",
  "params": "YOUR_SECRET_ACCESS_KEY"
}))
```

**Success Response:**
```json
[{
  "ev": "status",
  "status": "auth_success",
  "message": "authenticated"
}]
```

**Error Response:**
```json
[{
  "ev": "status",
  "status": "auth_failed",
  "message": "Your plan doesn't include websocket access"
}]
```

#### Step 3: Subscribe

**Single Symbol:**
```javascript
ws.send(JSON.stringify({
  "action": "subscribe",
  "params": "XA.X:BTCUSD"
}))
```

**Multiple Symbols (Comma-Separated):**
```javascript
ws.send(JSON.stringify({
  "action": "subscribe",
  "params": "XA.X:BTCUSD,XA.X:ETHUSD,XA.X:SOLUSD"
}))
```

**Success Response:**
```json
[{
  "ev": "status",
  "status": "success",
  "message": "subscribed to: XA.X:BTCUSD"
}]
```

**Error Response:**
```json
[{
  "ev": "status",
  "status": "error",
  "message": "not authorized"
}]
```

### Subscription Formats (CRITICAL!)

#### ✅ WORKING FORMATS (Tested):

**Crypto:**
- `XA.X:BTCUSD` - Crypto Aggregates ✅ **RECOMMENDED**
- `XT.X:BTCUSD` - Crypto Trades ✅
- `XQ.X:BTCUSD` - Crypto Quotes ✅

**Stocks:**
- `AM.AAPL` - Stock Minute Aggregates
- `T.AAPL` - Stock Trades
- `Q.AAPL` - Stock Quotes

**Forex:**
- `CA.C:EURUSD` - Forex Aggregates
- `C.C:EURUSD` - Forex Quotes

#### ❌ NOT AUTHORIZED (Don't Use):
- `AM.X:BTCUSD` - ❌ Not supported
- `A.X:BTCUSD` - ❌ Not supported
- `T.X:BTCUSD` - ❌ Not supported (use XT instead)

### Event Types

#### Crypto Aggregate (XA)
```json
{
  "ev": "XA",
  "sym": "X:BTCUSD",
  "s": 1700000000000,  // Start timestamp (Unix ms)
  "e": 1700000060000,  // End timestamp (Unix ms)
  "o": 88000.5,        // Open
  "h": 88500.2,        // High
  "l": 87800.1,        // Low
  "c": 88200.3,        // Close
  "v": 1234567.89,     // Volume
  "vw": 88150.4        // VWAP
}
```

#### Stock Aggregate Minute (AM)
```json
{
  "ev": "AM",
  "sym": "AAPL",
  "s": 1700000000000,
  "e": 1700000060000,
  "o": 150.5,
  "h": 151.2,
  "l": 150.1,
  "c": 151.0,
  "v": 12345,
  "vw": 150.8
}
```

#### Trade (T or XT)
```json
{
  "ev": "XT",          // or "T" for stocks
  "sym": "X:BTCUSD",
  "i": "50578",        // Trade ID
  "x": 4,              // Exchange ID
  "p": 88000.5,        // Price
  "s": 1.5,            // Size
  "t": 1700000000000,  // Timestamp
  "c": [37]            // Conditions
}
```

#### Quote (Q or XQ)
```json
{
  "ev": "XQ",          // or "Q" for stocks
  "sym": "X:BTCUSD",
  "bp": 88000.5,       // Bid price
  "bs": 10.5,          // Bid size
  "ap": 88001.2,       // Ask price
  "as": 8.3,           // Ask size
  "t": 1700000000000   // Timestamp
}
```

### Unsubscribe
```javascript
ws.send(JSON.stringify({
  "action": "unsubscribe",
  "params": "XA.X:BTCUSD"
}))
```

### Connection Limits

- **Free Tier:** No WebSocket access
- **Paid Tiers:** 1 concurrent connection per asset class
- **Enterprise:** Multiple connections (contact support)

**Error when limit exceeded:**
```json
{
  "ev": "status",
  "status": "max_connections",
  "message": "Maximum number of websocket connections exceeded"
}
```

---

## 3️⃣ Flat Files (S3 Access)

### S3 Configuration

```javascript
const AWS = require('aws-sdk')

const s3 = new AWS.S3({
  accessKeyId: 'YOUR_S3_ACCESS_KEY_ID',
  secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  endpoint: 'https://files.massive.com',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
})
```

### Bucket Structure

**Bucket Name:** `flatfiles`

**Paths:**
- `us_stocks_sip/trades_v1/YYYY/MM/YYYY-MM-DD.csv.gz`
- `us_stocks_sip/quotes_v3/YYYY/MM/YYYY-MM-DD.csv.gz`
- `us_stocks_sip/minute_aggregates/YYYY/MM/YYYY-MM-DD.csv.gz`
- `global_crypto/trades/YYYY/MM/YYYY-MM-DD.csv.gz`
- `global_crypto/minute_aggregates/YYYY/MM/YYYY-MM-DD.csv.gz`
- `global_forex/quotes/YYYY/MM/YYYY-MM-DD.csv.gz`

### Example: Download Crypto Data

```javascript
const params = {
  Bucket: 'flatfiles',
  Key: 'global_crypto/minute_aggregates/2024/11/2024-11-15.csv.gz'
}

const data = await s3.getObject(params).promise()

// Decompress and parse
const zlib = require('zlib')
const csv = zlib.gunzipSync(data.Body).toString()

// CSV format:
// ticker,volume,open,close,high,low,window_start,transactions
// BTCUSD,12345,88000.5,88200.3,88500.2,87800.1,1700000000000000000,5432
```

### AWS CLI Commands

```bash
# Configure
aws configure set aws_access_key_id YOUR_ACCESS_KEY_ID
aws configure set aws_secret_access_key YOUR_SECRET_KEY

# List files
aws s3 ls s3://flatfiles/global_crypto/minute_aggregates/2024/11/ \
  --endpoint-url https://files.massive.com

# Download file
aws s3 cp s3://flatfiles/global_crypto/minute_aggregates/2024/11/2024-11-15.csv.gz . \
  --endpoint-url https://files.massive.com
```

---

## 4️⃣ Client Libraries

### JavaScript/TypeScript (@polygon.io/client-js)

#### Installation
```bash
npm install @polygon.io/client-js
```

#### REST Client Usage
```javascript
import { restClient } from '@polygon.io/client-js'

// Initialize (works with both api.polygon.io and api.massive.com)
const rest = restClient('YOUR_SECRET_KEY', 'https://api.massive.com')

// Get aggregates
const response = await rest.crypto.aggregates(
  'X:BTCUSD',
  1,
  'hour',
  '2024-11-14',
  '2024-11-15',
  { limit: 1000 }
)

console.log(response.results)
```

#### WebSocket Client (Built-in)
```javascript
import { websocketClient } from '@polygon.io/client-js'

const ws = websocketClient('YOUR_SECRET_KEY', 'crypto')

ws.connect((err) => {
  if (err) {
    console.error('Connection error:', err)
    return
  }
  
  ws.subscribe(['XA.X:BTCUSD'])
})

ws.onData((data) => {
  console.log('Received:', data)
})
```

### Python (polygon-api-client)

```bash
pip install polygon-api-client
```

```python
from polygon import RESTClient

client = RESTClient(api_key="YOUR_SECRET_KEY")

# Get aggregates
aggs = client.get_aggs(
    ticker="X:BTCUSD",
    multiplier=1,
    timespan="hour",
    from_="2024-11-14",
    to="2024-11-15"
)

for a in aggs:
    print(f"Time: {a.timestamp}, Close: {a.close}")
```

### Go (client-go)

```bash
go get github.com/polygon-io/client-go
```

```go
import "github.com/polygon-io/client-go/rest"

client := polygon.New("YOUR_SECRET_KEY")

params := &models.GetAggregatesParams{
    Ticker:     "X:BTCUSD",
    Multiplier: 1,
    Timespan:   "hour",
    From:       "2024-11-14",
    To:         "2024-11-15",
}

res, err := client.GetAggregates(context.Background(), params)
```

---

## 5️⃣ Common Issues & Solutions

### Issue 1: "not authorized" on WebSocket

**Causes:**
1. Using wrong subscription format (e.g., `AM.X:BTCUSD` instead of `XA.X:BTCUSD`)
2. Plan doesn't include WebSocket access
3. Wrong API key (using Access Key ID instead of Secret Key)

**Solution:**
- For crypto, use `XA.X:TICKER` format
- Verify subscription at https://massive.com/dashboard
- Use Secret Access Key (not Access Key ID)

### Issue 2: Limited Results (16 candles)

**Cause:** Free tier or basic subscription

**Solution:**
```javascript
// Make multiple API calls
async function getAllCandles(symbol, days) {
  const allCandles = []
  
  for (let i = 0; i < days; i++) {
    const endDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
    
    const candles = await fetchDay(symbol, startDate, endDate)
    allCandles.push(...candles)
    
    await sleep(200) // Rate limit
  }
  
  return allCandles
}
```

### Issue 3: Max Connections Exceeded

**Cause:** Too many open WebSocket connections

**Solution:**
1. Close old connections before opening new ones
2. Reuse single connection for multiple symbols
3. Contact support to increase limit

### Issue 4: Future Dates (2025 instead of 2024)

**Cause:** System clock wrong or date calculation bug

**Solution:**
```javascript
// Always verify dates before API call
console.log('System date:', new Date())
console.log('Year:', new Date().getFullYear()) // Should be 2024!
```

---

## 6️⃣ Best Practices

### 1. Use Correct Endpoint
```javascript
// ✅ GOOD: Use new Massive.com endpoint
const rest = restClient(apiKey, 'https://api.massive.com')

// ⚠️ OK: Legacy endpoint still works
const rest = restClient(apiKey, 'https://api.polygon.io')
```

### 2. Handle Rate Limits
```javascript
// Implement exponential backoff
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (response.status === 429) {
        await sleep(Math.pow(2, i) * 1000)
        continue
      }
      return response
    } catch (err) {
      if (i === retries - 1) throw err
    }
  }
}
```

### 3. Cache Aggressively
```javascript
// Use Redis or in-memory cache
const cache = new Map()

async function getCachedCandles(symbol, timeframe) {
  const key = `${symbol}:${timeframe}`
  
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key)
    if (Date.now() - timestamp < 60000) { // 1 min TTL
      return data
    }
  }
  
  const data = await fetchCandles(symbol, timeframe)
  cache.set(key, { data, timestamp: Date.now() })
  return data
}
```

### 4. WebSocket Reconnection
```javascript
let reconnectAttempts = 0
const maxReconnectDelay = 30000

function connectWebSocket() {
  const ws = new WebSocket('wss://socket.massive.com/crypto')
  
  ws.on('close', () => {
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts), 
      maxReconnectDelay
    )
    
    console.log(`Reconnecting in ${delay}ms...`)
    setTimeout(connectWebSocket, delay)
    reconnectAttempts++
  })
  
  ws.on('open', () => {
    reconnectAttempts = 0 // Reset on successful connection
  })
}
```

---

## 7️⃣ Pricing & Plans

| Feature | Free | Developer | Advanced |
|---------|------|-----------|----------|
| **Price** | $0 | $199/mo | $399/mo |
| **API Calls/Min** | 5 | 100+ | Unlimited |
| **Results/Request** | 16 | 50,000 | Unlimited |
| **WebSocket** | ❌ No | ✅ Yes | ✅ Yes |
| **Flat Files** | ❌ No | ✅ Yes | ✅ Yes |
| **Support** | Community | Email | Priority |

---

## 📚 Additional Resources

- **Documentation:** https://massive.com/docs
- **Dashboard:** https://massive.com/dashboard
- **Support:** https://polygon.io/contact
- **Status Page:** https://status.massive.com
- **GitHub (Python):** https://github.com/massive-com/client-python
- **GitHub (Go):** https://github.com/polygon-io/client-go
- **NPM (JS):** https://www.npmjs.com/package/@polygon.io/client-js

---

*Documentation compiled from official Massive.com docs and real-world testing*
*Last updated: November 15, 2024*

