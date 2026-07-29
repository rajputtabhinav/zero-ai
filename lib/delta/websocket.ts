'use client'

export interface DeltaWebSocketMessage {
  type: string
  symbol?: string
  data?: any
}

export type MessageHandler = (message: DeltaWebSocketMessage) => void

export class DeltaWebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private messageHandlers: Set<MessageHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private isConnecting = false
  private subscribedChannels: Set<string> = new Set()

  constructor() {
    this.url = process.env.NEXT_PUBLIC_DELTA_WS_URL || 'wss://socket.delta.exchange'
  }

  /**
   * Connect to Delta Exchange WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('[Delta WS] Already connected')
        resolve()
        return
      }

      if (this.isConnecting) {
        console.log('[Delta WS] Connection already in progress')
        return
      }

      this.isConnecting = true
      console.log('[Delta WS] Connecting to:', this.url)

      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('✅ [Delta WS] Connected successfully')
          this.isConnecting = false
          this.reconnectAttempts = 0
          
          // Resubscribe to channels after reconnection
          this.resubscribeChannels()
          
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('[Delta WS] Error parsing message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('[Delta WS] WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log(`[Delta WS] Connection closed (code: ${event.code})`)
          this.isConnecting = false
          this.ws = null
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`[Delta WS] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            setTimeout(() => this.connect(), this.reconnectDelay)
          } else {
            console.error('[Delta WS] Max reconnection attempts reached')
          }
        }
      } catch (error) {
        console.error('[Delta WS] Error creating WebSocket:', error)
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any) {
    // Delta Exchange message format
    if (data.type === 'subscriptions') {
      console.log('[Delta WS] Subscription confirmed:', data.channels)
      return
    }

    if (data.type === 'ticker') {
      this.notifyHandlers({
        type: 'ticker',
        symbol: data.symbol,
        data: data
      })
    } else if (data.type === 'candlestick_1m' || data.type === 'candlestick') {
      this.notifyHandlers({
        type: 'candle',
        symbol: data.symbol,
        data: {
          timestamp: new Date(data.time * 1000).toISOString(),
          open: parseFloat(data.open),
          high: parseFloat(data.high),
          low: parseFloat(data.low),
          close: parseFloat(data.close),
          volume: parseFloat(data.volume || 0),
          time: data.time
        }
      })
    } else if (data.type === 'recent_trade' || data.type === 'all_trades') {
      this.notifyHandlers({
        type: 'trade',
        symbol: data.symbol,
        data: data
      })
    }
  }

  /**
   * Notify all registered message handlers
   */
  private notifyHandlers(message: DeltaWebSocketMessage) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message)
      } catch (error) {
        console.error('[Delta WS] Error in message handler:', error)
      }
    })
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeChannels() {
    if (this.subscribedChannels.size > 0) {
      console.log('[Delta WS] Resubscribing to channels:', Array.from(this.subscribedChannels))
      this.subscribedChannels.forEach(channel => {
        this.sendSubscription(channel)
      })
    }
  }

  /**
   * Send subscription message
   */
  private sendSubscription(channel: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'subscribe',
        payload: {
          channels: [{ name: channel }]
        }
      }
      this.ws.send(JSON.stringify(message))
      console.log(`[Delta WS] Subscribed to: ${channel}`)
    }
  }

  /**
   * Subscribe to ticker updates for a symbol
   */
  subscribeTicker(symbol: string) {
    const channel = `v2/ticker:${symbol}`
    this.subscribedChannels.add(channel)
    this.sendSubscription(channel)
  }

  /**
   * Subscribe to 1-minute candlestick updates
   */
  subscribeCandles(symbol: string) {
    const channel = `candlestick_1m:${symbol}`
    this.subscribedChannels.add(channel)
    this.sendSubscription(channel)
  }

  /**
   * Subscribe to trade updates
   */
  subscribeTrades(symbol: string) {
    const channel = `all_trades:${symbol}`
    this.subscribedChannels.add(channel)
    this.sendSubscription(channel)
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'unsubscribe',
        payload: {
          channels: [{ name: channel }]
        }
      }
      this.ws.send(JSON.stringify(message))
      this.subscribedChannels.delete(channel)
      console.log(`[Delta WS] Unsubscribed from: ${channel}`)
    }
  }

  /**
   * Unsubscribe from all channels for a symbol
   */
  unsubscribeSymbol(symbol: string) {
    const channelsToRemove = Array.from(this.subscribedChannels).filter(ch => 
      ch.includes(symbol)
    )
    channelsToRemove.forEach(channel => this.unsubscribe(channel))
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      console.log('[Delta WS] Disconnecting...')
      this.subscribedChannels.clear()
      this.reconnectAttempts = this.maxReconnectAttempts // Prevent auto-reconnect
      this.ws.close()
      this.ws = null
    }
  }
}

// Export singleton instance for client-side use
let wsClient: DeltaWebSocketClient | null = null

export function getDeltaWebSocket(): DeltaWebSocketClient {
  if (typeof window === 'undefined') {
    throw new Error('DeltaWebSocketClient can only be used in the browser')
  }
  
  if (!wsClient) {
    wsClient = new DeltaWebSocketClient()
  }
  
  return wsClient
}

