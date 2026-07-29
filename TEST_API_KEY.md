# 🔑 API Key Testing Guide

## Issue: 401 Unauthorized Error

The current error indicates your API key is being rejected by Polygon.io/Massive.com.

---

## 🧪 Let's Test Your Credentials

### Method 1: Test with cURL (Recommended)

Open PowerShell and run:

```powershell
# Test with Access Key ID
curl "https://api.polygon.io/v2/aggs/ticker/X:BTCUSD/range/1/hour/2024-01-01/2024-01-02?apiKey=b8b719e6-222c-42fe-beb2-dbb6e0c1a599"
```

**Expected Results:**

✅ **If it works (200 OK):**
```json
{
  "status": "OK",
  "results": [...]
}
```
→ Your Access Key ID is valid! The code should work now.

❌ **If you get 401:**
```json
{
  "status": "ERROR",
  "error": "Invalid API key"
}
```
→ Your API key might not be active yet or is for a different service.

❌ **If you get 403:**
```json
{
  "status": "ERROR", 
  "error": "You don't have access to this endpoint"
}
```
→ Your subscription might not include REST API access.

---

## 🤔 Possible Issues:

### 1. **API Key Not Active Yet**

Your subscription might still be pending activation. 

**Solution:**
- Check your email for activation confirmation
- Log into Polygon.io/Massive.com dashboard
- Verify subscription status

### 2. **Wrong Credentials for REST API**

The AWS-style credentials you provided might be for:
- ✅ **S3 Flatfiles** (https://files.massive.com)
- ❌ **NOT for REST API**

**Solution:**
- Check if you have a separate REST API key
- Look for a key that starts with different characters
- Contact Massive.com support to get REST API credentials

### 3. **Need to Use Massive.com Endpoint**

Maybe you need to use `api.massive.com` instead of `api.polygon.io`

**Test:**
```powershell
curl "https://api.massive.com/v2/aggs/ticker/X:BTCUSD/range/1/hour/2024-01-01/2024-01-02?apiKey=b8b719e6-222c-42fe-beb2-dbb6e0c1a599"
```

### 4. **Subscription Includes Only Flatfiles**

Your subscription might be for **flatfile downloads only** (via S3), not REST API.

**Check your subscription:**
- Go to: https://polygon.io/dashboard (or https://massive.com/dashboard)
- Look for: "Subscription Type"
- Verify: "REST API Access" is included

---

## 🔍 How to Find Your Correct API Key

### Step 1: Log into Your Account

Visit: https://polygon.io/dashboard (or https://massive.com/dashboard)

### Step 2: Find API Keys Section

Look for:
- "API Keys"
- "Credentials"
- "Developer Settings"

### Step 3: Identify the Right Key

You should see something like:

**For REST API:**
```
API Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Type: REST API
```

**For S3 Flatfiles:**
```
Access Key ID: b8b719e6-222c-42fe-beb2-dbb6e0c1a599
Secret Access Key: pAwM2V2SuJqFepuJEYifphap0nJS1TFb
Type: S3 Access
```

**You need the REST API key, not the S3 credentials!**

---

## ✅ Once You Have the Correct Key:

### Update `.env.local`:

```bash
# Replace with your actual REST API key
MASSIVE_API_KEY=your-rest-api-key-here
MASSIVE_ACCESS_KEY_ID=your-rest-api-key-here
```

### Restart Server:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Test Again:

Open: http://localhost:3000

Should see:
```
✅ Loaded 1000 real candles from Polygon/Massive API
```

---

## 🆘 Still Not Working?

### Contact Support:

**Polygon.io:**
- Email: support@polygon.io
- Dashboard: https://polygon.io/dashboard

**Massive.com:**
- Check if there's a separate portal
- Verify which credentials are for which service

**What to Ask:**
```
Hello,

I have a Massive.com subscription for crypto and forex data.

My credentials are:
- Access Key ID: b8b719e6-...
- Secret Access Key: pAwM2V...

Questions:
1. Are these for REST API or only S3 flatfiles?
2. How do I access the REST API?
3. What's the correct API key for /v2/aggs endpoints?
4. What base URL should I use (api.polygon.io or api.massive.com)?

Thank you!
```

---

## 🔄 Alternative: Use Free Polygon.io Key

While waiting for Massive.com support:

1. **Sign up for free Polygon.io:**
   - Visit: https://polygon.io/
   - Create account
   - Get free API key

2. **Add to `.env.local`:**
   ```
   MASSIVE_API_KEY=your-free-polygon-key
   ```

3. **Limitations:**
   - 5 API calls/minute (vs 100/min paid)
   - 15-minute delayed data (vs real-time)
   - Still works for testing!

---

## 📞 Next Steps:

1. ✅ **Run the cURL test above** (most important!)
2. ✅ **Check test results** (200 OK vs 401 vs 403)
3. ✅ **Log into Polygon/Massive dashboard**
4. ✅ **Verify subscription type**
5. ✅ **Find correct REST API key**
6. ✅ **Update `.env.local`**
7. ✅ **Test again**

**Run the cURL command and tell me what you get!** I can help debug based on the exact error message.

