import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined | null
}

// Try to connect to Redis, but don't fail if it's not available
let redis: Redis | null = null

try {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  console.log(`📦 Initializing Redis connection to: ${redisUrl}`)
  
  redis = globalForRedis.redis ?? new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️ Redis connection failed after 3 retries - caching disabled')
        return null // Stop retrying
      }
      const delay = Math.min(times * 100, 2000)
      console.log(`🔄 Redis retry ${times}/3 in ${delay}ms...`)
      return delay
    },
    lazyConnect: false, // Connect immediately for production
    connectTimeout: 10000,
  })

  // Handle connection events
  redis.on('connect', () => {
    console.log('✅ Redis connected successfully')
  })

  redis.on('ready', () => {
    console.log('✅ Redis ready to accept commands')
  })

  redis.on('error', (error) => {
    console.warn('⚠️ Redis error:', error.message)
    // Don't set to null - let it auto-retry
  })

  redis.on('close', () => {
    console.warn('⚠️ Redis connection closed')
  })

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...')
  })

  if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
} catch (error) {
  console.error('❌ Redis initialization failed:', error)
  redis = null
}

export { redis }

// Helper functions for common operations (gracefully handle Redis being unavailable)
export const cacheHelpers = {
  // Cache candle data
  async setCandles(symbol: string, timeframe: string, candles: any[], ttl: number = 3600) {
    if (!redis) return
    try {
      const key = `candles:${symbol}:${timeframe}`
      await redis.setex(key, ttl, JSON.stringify(candles))
    } catch (error) {
      console.warn('Cache set failed:', error)
    }
  },

  async getCandles(symbol: string, timeframe: string): Promise<any[] | null> {
    if (!redis) return null
    try {
      const key = `candles:${symbol}:${timeframe}`
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Cache get failed:', error)
      return null
    }
  },

  // Cache AI predictions
  async setPrediction(symbol: string, timeframe: string, prediction: any, ttl: number = 300) {
    if (!redis) return
    try {
      const key = `prediction:${symbol}:${timeframe}`
      await redis.setex(key, ttl, JSON.stringify(prediction))
    } catch (error) {
      console.warn('Cache set failed:', error)
    }
  },

  async getPrediction(symbol: string, timeframe: string): Promise<any | null> {
    if (!redis) return null
    try {
      const key = `prediction:${symbol}:${timeframe}`
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Cache get failed:', error)
      return null
    }
  },

  // Cache market scanner results
  async setScanResults(results: any, ttl: number = 600) {
    if (!redis) return
    try {
      await redis.setex('market:scan:latest', ttl, JSON.stringify(results))
    } catch (error) {
      console.warn('Cache set failed:', error)
    }
  },

  async getScanResults(): Promise<any | null> {
    if (!redis) return null
    try {
      const data = await redis.get('market:scan:latest')
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Cache get failed:', error)
      return null
    }
  },

  // Rate limiting
  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    if (!redis) return true // Allow if Redis unavailable
    try {
      const current = await redis.incr(key)
      if (current === 1) {
        await redis.expire(key, window)
      }
      return current <= limit
    } catch (error) {
      console.warn('Rate limit check failed:', error)
      return true // Allow on error
    }
  },

  // Store sliding window of candles for real-time updates
  async addCandle(symbol: string, timeframe: string, candle: any) {
    if (!redis) return
    try {
      const key = `candles:stream:${symbol}:${timeframe}`
      await redis.lpush(key, JSON.stringify(candle))
      await redis.ltrim(key, 0, 4999) // Keep last 5000 candles
    } catch (error) {
      console.warn('Cache add failed:', error)
    }
  },

  async getRecentCandles(symbol: string, timeframe: string, count: number = 200): Promise<any[]> {
    if (!redis) return []
    try {
      const key = `candles:stream:${symbol}:${timeframe}`
      const data = await redis.lrange(key, 0, count - 1)
      return data.map(item => JSON.parse(item)).reverse()
    } catch (error) {
      console.warn('Cache get failed:', error)
      return []
    }
  },
}

