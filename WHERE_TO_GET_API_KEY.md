# 🔑 Where to Get Your API Key - Visual Guide

## 🎯 Quick Answer

**You need to click a DIFFERENT tab in the same page you're already on!**

---

## 📸 Your Current View (Screenshot You Showed Me)

```
┌─────────────────────────────────────────────────────┐
│ Keys / 18dd78cc-6754-484b-8844-bab2f181d590         │
│                                                      │
│ tender_hypatia                    [Delete] [Regen]  │
│                                                      │
│ [ Accessing the API ]  [Accessing Flat Files (S3)]← YOU ARE HERE
│ ──────────────────────  ═══════════════════════════  │
│                                                      │
│ Name                   tender_hypatia               │
│ Access Key ID          18dd78cc-6754-484b-8844...   │
│ Secret Access Key      ciAMpgoA7rHFigAkrtW3FQUm...  │
│ S3 Endpoint           https://files.massive.com    │
│ Bucket                flatfiles                     │
└─────────────────────────────────────────────────────┘
```

**❌ This shows S3 credentials (for bulk file downloads)**

---

## ✅ Where You NEED to Click

```
┌─────────────────────────────────────────────────────┐
│ Keys / 18dd78cc-6754-484b-8844-bab2f181d590         │
│                                                      │
│ tender_hypatia                    [Delete] [Regen]  │
│                                                      │
│ ═══════════════════════  [ Accessing Flat Files (S3)]
│   ↑                     ──────────────────────────  │
│   │                                                 │
│   CLICK HERE!                                       │
│                                                     │
│ Name                   tender_hypatia              │
│ API Key                abc123-def456-ghi789...  ← COPY THIS!
│                                                    │
│ [Copy] button                                      │
│                                                    │
│ Usage: Use this key in REST API and WebSocket     │
│        requests as the apiKey parameter           │
└────────────────────────────────────────────────────┘
```

---

## 🎬 Step-by-Step Instructions

### Step 1: You're Already in the Right Place!
- URL: https://massive.com/dashboard/keys
- You should see your key: **tender_hypatia**

### Step 2: Click the OTHER Tab
Look at the top of the section - you'll see **TWO tabs**:

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  [ Accessing the API ]  [Accessing Flat Files] │
│   ↑                                             │
│   └─── CLICK HERE                               │
└─────────────────────────────────────────────────┘
```

**Click:** "Accessing the API"  
**NOT:** "Accessing Flat Files (S3)" ← This is where you are now

### Step 3: Copy the API Key
You'll see something like:

```
Name: tender_hypatia
API Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
         [Copy] button
```

**Click the [Copy] button**

### Step 4: Add to Your Project
Open `.env.local` in your project and add:

```bash
MASSIVE_SECRET_ACCESS_KEY=paste_the_key_you_copied_here
```

### Step 5: Restart Server
```bash
npm run dev
```

### Step 6: Test It!
```bash
node test-existing-keys.js
```

You should see:
```
✅ REST API WORKS!
✅ WebSocket WORKS!
```

---

## 🤔 Visual Comparison

### What You Have Now (S3 Credentials):
```
┌────────────────────────────────────────┐
│ Accessing Flat Files (S3) Tab         │
├────────────────────────────────────────┤
│ Access Key ID:     UUID-format        │
│ Secret Access Key: Long random string │
│                                        │
│ Use: Download bulk historical files   │
│ via S3 protocol                        │
└────────────────────────────────────────┘
```

### What You Need (REST API Key):
```
┌────────────────────────────────────────┐
│ Accessing the API Tab                  │
├────────────────────────────────────────┤
│ API Key: UUID-format string            │
│                                        │
│ Use: REST API calls and WebSocket     │
│ for real-time trading data             │
└────────────────────────────────────────┘
```

---

## 🔍 How to Identify the Correct Key

### ❌ WRONG (S3 - What you showed me):
```
Access Key ID: 18dd78cc-6754-484b-8844-bab2f181d590
Secret Access Key: ciAMpgoA7rHFigAkrtW3FQUmGbnIvYRj
```
- **Has TWO separate values**
- **Says "S3 Endpoint"**
- **Tab says "Flat Files"**

### ✅ RIGHT (REST API - What you need):
```
API Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
- **Has ONE value** (just "API Key")
- **Tab says "Accessing the API"**
- **Mentions REST API or WebSocket**

---

## 📋 Quick Decision Tree

```
Are you looking at "Accessing Flat Files (S3)" tab?
│
├─ YES → ❌ WRONG TAB! Click "Accessing the API"
│
└─ NO (seeing "Accessing the API") → ✅ CORRECT!
   │
   └─ Do you see "API Key" (singular)?
      │
      ├─ YES → ✅ Copy this key!
      │
      └─ NO (seeing Access Key ID + Secret) → ❌ Wrong tab!
```

---

## 🎯 TL;DR (Too Long; Didn't Read)

1. **Same page you're on**
2. **Click the OTHER tab** ("Accessing the API")
3. **Copy the API key**
4. **Paste into `.env.local`**
5. **Restart server**
6. **Done!** 🎉

---

## 💡 Pro Tip

The tab you need might be **on the left** of where you are now. Look for these exact words:

```
"Accessing the API"
```

NOT:

```
"Accessing Flat Files (S3)"  ← You are here
```

---

## 🆘 Still Can't Find It?

If you still can't see the "Accessing the API" tab:

1. **Try logging out and back in**
2. **Check if your account has API access enabled**
3. **Contact Massive.com support:** support@massive.com
4. **Or share another screenshot** showing the full page (I'll help you find it!)

---

## ✅ Verification

Once you add the correct key, run:

```bash
node test-existing-keys.js
```

You should see:
```
✅ REST API WORKS! Got 168 results
📈 Latest BTC price: $88456.70
✅ WebSocket WORKS! Authentication successful
📊 Live BTC data: $88456.70 at 4:59:26 PM
```

If you see these ✅ messages, **you got the right key!**

If you still see ❌ errors, **you copied from the wrong tab.**

---

**The key you need is on the SAME page, just a different tab! Click "Accessing the API"! 🔑**

