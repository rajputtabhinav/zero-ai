# 🔑 Massive.com API Keys - Complete Guide

## ⚠️ IMPORTANT: Different Keys for Different Uses

Massive.com has **TWO TYPES** of credentials:

### 1️⃣ **REST API / WebSocket Key** (What you need for trading)
- **Used for:** REST API calls and WebSocket real-time data
- **Format:** Single API key string (looks like: `abc123...`)
- **Found in:** Dashboard → Keys → **"Accessing the API"** tab
- **Use in:** Query parameter `?apiKey=YOUR_KEY` or as WebSocket auth

### 2️⃣ **S3 Credentials** (For bulk file downloads)
- **Used for:** Downloading flat files (historical bulk data)
- **Format:** Two keys (Access Key ID + Secret Access Key)
- **Found in:** Dashboard → Keys → **"Accessing Flat Files (S3)"** tab
- **Use in:** S3 client configuration (like AWS S3)

---

## 📸 What You Showed Me

Your screenshot shows **S3 credentials** from the "Accessing Flat Files (S3)" tab:
```
Access Key ID: 18dd78cc-6754-484b-8844-bab2f181d590
Secret Access Key: ciAMpgoA7rHFigAkrtW3FQUmGbnIvYRj
```

❌ **These CANNOT be used for REST API or WebSocket!**

---

## ✅ How to Get Your REST API Key

1. Go to: https://massive.com/dashboard/keys
2. Click on the **"Accessing the API"** tab (NOT the S3 tab)
3. Look for your API key - it should look like:
   ```
   Key: tender_hypatia
   API Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
4. Copy the **API Key** value

---

## 🔧 Current Configuration

Your project currently has these keys configured (found in `CREATE_ENV_FILE.md`):

```env
MASSIVE_ACCESS_KEY_ID=b8b719e6-222c-42fe-beb2-dbb6e0c1a599
MASSIVE_SECRET_ACCESS_KEY=pAwM2V2SuJqFepuJEYifphap0nJS1TFb
```

Let me test if these work...

---

## 📊 Testing Both Key Types

### For REST API & WebSocket:
- Use `MASSIVE_SECRET_ACCESS_KEY` as the API key
- Endpoint: `https://api.massive.com`
- WebSocket: `wss://socket.massive.com/crypto` or `/forex`

### For S3 Flat Files:
- Use both `MASSIVE_ACCESS_KEY_ID` and `MASSIVE_SECRET_ACCESS_KEY`
- Endpoint: `https://files.massive.com`
- S3 bucket: `flatfiles`

---

## 🎯 Next Steps

1. **Go to your Massive.com dashboard**
2. **Click "Accessing the API" tab** (not S3)
3. **Copy your API key from there**
4. **Add it to your `.env.local`:**
   ```env
   MASSIVE_SECRET_ACCESS_KEY=your_api_key_here
   ```

---

## 🔍 Key Naming in Your Code

Your codebase tries multiple environment variable names:
- `MASSIVE_SECRET_ACCESS_KEY` (primary)
- `MASSIVE_SECRET_KEY` (fallback)
- `MASSIVE_API_KEY` (fallback)

So you can use any of these names in `.env.local`.

---

## 📝 Summary

| Use Case | Key Type | Where to Find | Format |
|----------|----------|---------------|--------|
| **REST API** | API Key | "Accessing the API" tab | Single string |
| **WebSocket** | API Key | "Accessing the API" tab | Single string |
| **S3 Files** | Access Key ID + Secret | "Accessing Flat Files (S3)" tab | Two keys |

**You showed me S3 credentials, but we need the REST API key! 🔑**

