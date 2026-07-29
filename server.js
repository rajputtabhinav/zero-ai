// Simple Next.js Server - No WebSocket (AI Predictions Only)
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Start server
  httpServer
    .once('error', (err) => {
      console.error('❌ Server error:', err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`✅ Next.js server ready on http://${hostname}:${port}`)
      console.log(`🤖 AI Prediction Mode - REST API Only`)
      console.log(`📊 Supports: Crypto & Forex Markets`)
    })
})

