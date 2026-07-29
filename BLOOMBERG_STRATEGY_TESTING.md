# 🧪 Testing the Bloomberg Parallel Strategy

## Quick Test Guide

### Test 1: Small Request (Single Fetch)

```typescript
// Should use single API call
const candles = await massiveClient.getCandles(
  'BTCUSD',
  '1H',
  new Date('2025-10-15'),
  new Date('2025-11-15')
)

// Expected output:
// [Polygon] ✅ Small request (720 ≤ 5000), using single fetch
// Time: ~1-2 seconds
// Candles: ~720
```

### Test 2: Large Request (Parallel Strategy)

```typescript
// Should use Bloomberg parallel chunking
const candles = await massiveClient.getCandles(
  'ETHUSD',
  '5m',
  new Date('2025-01-01'),
  new Date('2025-11-15')
)

// Expected output:
// [Polygon] 🚀 Large request detected, using Bloomberg parallel strategy
// [Bloomberg Strategy] 📦 Splitting into X chunks
// [Bloomberg Strategy] 🔄 Fetching chunks in parallel
// Time: ~3-5 seconds
// Candles: ~90,000+
```

### Test 3: Very Large Request

```typescript
// Test extreme case: 1 year of minute data
const candles = await massiveClient.getCandles(
  'BTCUSD',
  '1m',
  new Date('2024-01-01'),
  new Date('2025-11-15')
)

// Expected output:
// [Bloomberg Strategy] 📦 Splitting into ~100 chunks
// Time: ~15-20 seconds
// Candles: ~500,000+
```

---

## Frontend Testing

### From Your Chart Component

```typescript
// app/page.tsx or wherever you load charts
const loadChart = async () => {
  setLoading(true)
  
  try {
    // Test with large date range
    const response = await fetch(
      `/api/massive/candles?symbol=BTCUSD&timeframe=5m&from=2025-01-01&to=2025-11-15`
    )
    
    const data = await response.json()
    console.log(`✅ Loaded ${data.candles.length} candles`)
    setCandles(data.candles)
  } catch (error) {
    console.error('❌ Error:', error)
  }
  
  setLoading(false)
}
```

---

## Console Output Examples

### Successful Parallel Fetch

```
[Polygon] Getting candles for BTCUSD → X:BTCUSD, timeframe: 5m
[Polygon] Date range provided: 320.0 days = ~92160 expected candles
[Polygon] 🚀 Large request detected (92160 > 5000), using Bloomberg parallel strategy
[Bloomberg Strategy] 🚀 Parallel fetching BTCUSD from 1/1/2025 to 11/15/2025
[Bloomberg Strategy] 📊 Expected 92160 candles over 320 days
[Bloomberg Strategy] 📦 Splitting into 19 chunks (17 days per chunk)
[Bloomberg Strategy] 🔄 Fetching 19 chunks in parallel (max 4 at a time)
[Bloomberg Strategy] ⏳ Fetching batch 1/5 (chunks 1-4)
[Bloomberg Strategy] ✅ Batch complete. Total candles so far: 19,421
[Bloomberg Strategy] ⏳ Fetching batch 2/5 (chunks 5-8)
[Bloomberg Strategy] ✅ Batch complete. Total candles so far: 38,842
[Bloomberg Strategy] ⏳ Fetching batch 3/5 (chunks 9-12)
[Bloomberg Strategy] ✅ Batch complete. Total candles so far: 58,263
[Bloomberg Strategy] ⏳ Fetching batch 4/5 (chunks 13-16)
[Bloomberg Strategy] ✅ Batch complete. Total candles so far: 77,684
[Bloomberg Strategy] ⏳ Fetching batch 5/5 (chunks 17-19)
[Bloomberg Strategy] ✅ Batch complete. Total candles so far: 92,160
[Bloomberg Strategy] 🎉 Complete! Fetched 92,137 unique candles (removed 23 duplicates)
[Bloomberg Strategy] ✅ Cached 92,137 candles for 60s
```

---

## Performance Expectations

| Timeframe | Date Range | Expected Candles | Strategy | Time |
|-----------|------------|------------------|----------|------|
| 1H | 1 month | ~720 | Single | 1-2s |
| 1H | 6 months | ~4,320 | Single | 2-3s |
| 1H | 1 year | ~8,760 | Parallel | 3-4s |
| 5m | 1 week | ~2,016 | Single | 1-2s |
| 5m | 1 month | ~8,640 | Parallel | 3-4s |
| 5m | 3 months | ~25,920 | Parallel | 5-6s |
| 1m | 1 day | ~1,440 | Single | 1-2s |
| 1m | 1 week | ~10,080 | Parallel | 4-5s |
| 1m | 1 month | ~43,200 | Parallel | 8-10s |

---

## What to Look For

### ✅ Success Indicators

1. **No timeout errors** on large requests
2. **Consistent speed** regardless of date range
3. **Accurate candle counts** matching expected values
4. **No duplicate timestamps** in results
5. **Cached results** on subsequent identical requests
6. **Console shows parallel strategy** for large requests

### ❌ Potential Issues

1. **Rate limit errors** → Reduce `MAX_PARALLEL_REQUESTS`
2. **Out of memory** → Increase chunk size
3. **Slow performance** → Check API key/network
4. **Missing candles** → Check date range/market hours

---

## Debugging

### Enable Verbose Logging

All Bloomberg strategy operations log to console:
- Chunk creation
- Batch fetching
- Progress updates
- Duplicate removal
- Cache operations

### Check Network Tab

In browser DevTools:
- Single fetch: 1 API request
- Parallel: Multiple simultaneous requests
- All should return 200 OK

### Verify Data Quality

```typescript
// Check for gaps
const timestamps = candles.map(c => new Date(c.timestamp).getTime())
const gaps = timestamps
  .slice(1)
  .map((t, i) => t - timestamps[i])
  .filter(gap => gap > expectedInterval * 2)

if (gaps.length > 0) {
  console.warn('Data gaps detected:', gaps.length)
}
```

---

## Next Steps

1. **Test with your most common symbols** (BTCUSD, ETHUSD, etc.)
2. **Try different timeframes** (1m, 5m, 1H, 1D)
3. **Test large date ranges** (months to years)
4. **Monitor performance** and adjust if needed
5. **Check cache behavior** with repeated requests

---

**The Bloomberg strategy is now live and ready to use!** 🚀

