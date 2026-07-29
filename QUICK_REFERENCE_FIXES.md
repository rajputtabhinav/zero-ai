# ⚡ Quick Reference - All Issues & Fixes

## 🎯 **TL;DR**

✅ **WebSocket Format FIXED** - Changed from `AM.X:` to `XA.X:`  
❌ **Date Bug CRITICAL** - System showing 2025 instead of 2024  
⚠️ **Data Limits** - Free tier: 16 results per call  

---

## 🔴 **CRITICAL: Date Bug**

### Check This RIGHT NOW:
```powershell
Get-Date
```

**Expected:** Friday, November 15, **2024**  
**If Shows:** November 15, **2025** ← **FIX IMMEDIATELY!**

### How to Fix Windows System Clock:
1. Press `Windows + I` (Settings)
2. Go to **Time & Language** → **Date & Time**
3. Click **"Sync now"** button
4. Verify year shows **2024**
5. Restart your server

---

## ✅ **WebSocket - FIXED!**

### What Changed:
```javascript
// OLD (BROKEN):
AM.X:BTCUSD  → "not authorized" ❌

// NEW (WORKING):
XA.X:BTCUSD  → "subscribed successfully" ✅
```

### Files Updated:
- ✅ `server.js` - Lines 81-96
- ✅ `lib/massive/websocket.ts` - Lines 112, 160

### How to Verify:
```bash
# Terminal should show:
✅ WebSocket authenticated successfully
📊 Subscribed to: XA.X:BTCUSD

# Wait 1-10 minutes for:
📊 LIVE CRYPTO: X:BTCUSD @ $88000 (vol: 1234567)
```

---

## ⚠️ **Data Limits - Known Issue**

### Your Subscription:
- REST API: 16 results per call
- Rate limit: 5 calls/minute
- WebSocket: 1 connection

### Current Behavior:
```
Requested: 1000 candles
Received: 83 candles (from multiple calls)
Expected: 16 × 5 = 80 candles max per minute
```

### Quick Fix Options:

**Option 1: Make More Calls**
```javascript
// Takes 12 minutes to get 1000 candles (60 calls ÷ 5/min)
for (let i = 0; i < 60; i++) {
  await fetchDay(symbol, dayStart, dayEnd)
  await sleep(12000) // 12 sec = 5 calls/min
}
```

**Option 2: Use Flat Files (S3)**
```bash
npm install aws-sdk csv-parse

# Download entire day (1440 candles) in seconds
# No rate limits!
```

**Option 3: Upgrade**
- Developer: $199/mo → 50,000 results/call
- Get 1000 candles in 1 second!

---

## 📋 **CHECKLIST**

### Immediate (Now):
- [ ] Check system date (`Get-Date`)
- [ ] Fix if showing 2025
- [ ] Restart server
- [ ] Monitor terminal for 10 minutes

### This Hour:
- [ ] Add debug logging to `lib/massive/client.ts`
- [ ] Verify API requests use 2024 dates
- [ ] Check WebSocket for live data
- [ ] Visit dashboard to monitor connection

### Today:
- [ ] Implement multi-call if needed
- [ ] Test with different symbols
- [ ] Document what's working
- [ ] Plan next steps

### This Week:
- [ ] Flat Files integration (S3)
- [ ] Visual indicators on chart
- [ ] Improve error handling
- [ ] Consider subscription upgrade

---

## 🧪 **TESTING COMMANDS**

### Test REST API:
```bash
# Should return 16 candles for today
curl "https://api.massive.com/v2/aggs/ticker/X:BTCUSD/range/1/hour/2024-11-15/2024-11-15?apiKey=clAMpgoA7rHFtgAkrtW3FQUmGbnIvYRj"
```

### Check System Date:
```powershell
Get-Date
Write-Host "Year:" (Get-Date).Year  # Must be 2024!
```

### Monitor WebSocket:
```bash
# Visit in browser:
https://massive.com/dashboard/websocket

# Should show:
# - Status: Active
# - Messages: Increasing
# - Subscriptions: Success
```

---

## 📊 **CURRENT STATUS SUMMARY**

| Component | Status | Issue | Fix |
|-----------|--------|-------|-----|
| REST API Auth | ✅ Working | None | - |
| REST API Data | ⚠️ Limited | 16 results only | Multi-call or upgrade |
| WebSocket Auth | ✅ Working | None | - |
| WebSocket Subscribe | ✅ Fixed | Was using AM instead of XA | ✅ Done |
| WebSocket Live Data | ⏳ Waiting | No data yet | Monitor 10+ min |
| Date Calculation | ❌ Broken | Shows 2025 instead of 2024 | Check system clock |
| Chart Rendering | ✅ Working | None | - |
| Redis Caching | ❌ Down | Connection failed | Start Redis or remove |

---

## 🎯 **PRIORITY #1: FIX DATE BUG**

**This is blocking everything else!**

If your system date is November 15, 2025 instead of 2024:
- API returns no current data
- All dates are off by 1 year
- Chart shows old cached data
- Cannot get real-time prices

**Fix Windows System Clock:**
1. Settings → Time & Language → Date & Time
2. Set correct year: **2024** (not 2025)
3. Sync with internet time
4. Restart server
5. Verify terminal logs show correct dates

---

## 📞 **GET HELP**

### If Date is Correct but Still Shows 2025:
- Add debug logging (see `HOW_TO_FIX_BASED_ON_DOCS.md`)
- Check if Polygon client library has bug
- Try direct fetch instead of library

### If WebSocket Never Receives Data:
- Wait 10+ minutes (crypto can be slow)
- Try `XT.X:BTCUSD` (trades) instead of `XA` (aggregates)
- Check dashboard for active subscription
- Verify no connection limit errors

### If Still Stuck:
- Contact: support@massive.com
- Include: Your API key name, timestamps, error logs
- Reference: This document and test results

---

## ✅ **SUCCESS METRICS**

You'll know it's working when:
- ✅ Terminal shows 2024 dates (not 2025)
- ✅ Chart shows recent data (last 60 days)
- ✅ Data age < 24 hours
- ✅ WebSocket logs: "📊 LIVE CRYPTO: X:BTCUSD @ $[current price]"
- ✅ Dashboard shows messages increasing
- ✅ Browser shows "● LIVE" indicator (green)

---

**Your WebSocket is configured correctly - just need to fix date bug and wait for data! 🚀**

*Quick reference guide for rapid troubleshooting*

