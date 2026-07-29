'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LightweightChart } from '@/components/charts/LightweightChart'
import { ScalpingSignalDisplay } from '@/components/trading/ScalpingSignalDisplay'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchSuggestion, ScalpingSignal } from '@/types/trading'
import { useMarketData } from '@/lib/hooks/useMarketData'
import { useDeltaWebSocket } from '@/lib/hooks/useDeltaWebSocket'

export default function HomePage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showCryptoMenu, setShowCryptoMenu] = useState(false)
  const [showForexMenu, setShowForexMenu] = useState(false)
  const [scalpingSignal, setScalpingSignal] = useState<ScalpingSignal | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [cryptoPairs, setCryptoPairs] = useState<string[]>([])
  const [loadingPairs, setLoadingPairs] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Custom hooks
  const {
    candlesData,
    predictionsData,
    setPredictionsData,
    loading,
    loadCandles,
    updateCandle
  } = useMarketData(symbol)

  const { isConnected: wsConnected } = useDeltaWebSocket(symbol, updateCandle)

  // Fetch available crypto pairs from Delta Exchange on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('📊 Fetching available products from Delta Exchange...')
        const response = await fetch('/api/delta/products')
        const data = await response.json()

        if (data.products && data.products.length > 0) {
          const symbols = data.products.map((p: any) => p.symbol)
          setCryptoPairs(symbols)
          console.log(`✅ Loaded ${symbols.length} trading pairs from Delta Exchange`)
        } else {
          setCryptoPairs(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'])
          console.warn('⚠️ Using fallback crypto pairs')
        }
      } catch (error) {
        console.error('❌ Error fetching products:', error)
        setCryptoPairs(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'])
      } finally {
        setLoadingPairs(false)
      }
    }

    fetchProducts()
  }, [])

  // Forex removed - Delta Exchange only supports crypto
  const forexPairs: string[] = []

  // Debounced search
  const searchSymbols = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/delta/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.results) {
        setSuggestions(data.results.slice(0, 8))
      }
    } catch (error) {
      console.warn('Search failed:', error)
      setSuggestions([])
    }
  }, [])

  // Real-time clock
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(clockInterval)
  }, [])

  const generateScalpingSignal = async () => {
    // Need at least 50 candles on 15m (slowest timeframe)
    if (!candlesData['15m'] || candlesData['15m'].length < 50) {
      console.warn('⚠️ Need 50+ candles on 15m for scalping analysis')
      alert('Need more data. Please wait for charts to load completely.')
      return
    }

    setGenerating(true)

    try {
      console.log('🎯 Generating scalping signal...')

      const response = await fetch('/api/ai/scalping-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, candlesData })
      })

      const data = await response.json()

      if (data.error) {
        console.error('❌ Failed to generate signal:', data.error)
        alert(`Error: ${data.error}`)
        return
      }

      if (data.predictions) {
        setPredictionsData(data.predictions)
      }

      if (data.signal) {
        setScalpingSignal(data.signal)

        // Log scalping-specific info
        console.log('🎯 Scalping Signal:', data.signal.action)
        console.log('📊 15m Trend:', data.signal.trend15m)
        console.log('⚡ Entry Price:', data.signal.entryPrice)
        console.log('🎯 Target:', data.signal.target, `(+${data.signal.profitPercent}%)`)
        console.log('🛑 Stop Loss:', data.signal.stopLoss, `(-${data.signal.riskPercent}%)`)
        console.log('⏱️ Hold Time:', data.signal.holdTimeMinutes, 'minutes')
      }
    } catch (error) {
      console.error('❌ Error generating scalping signal:', error)
      alert('Failed to generate signal. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setSymbol(value)

    if (value.length >= 3) {
      searchSymbols(value)
    } else {
      setSuggestions([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSearch = () => {
    setShowSuggestions(false)
    loadCandles()
  }

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setSymbol(suggestion.symbol)
    setShowSuggestions(false)
    setTimeout(loadCandles, 100)
  }

  const totalCandles = Object.values(candlesData).reduce((sum, candles) => sum + candles.length, 0)

  const [selectedTimeframe, setSelectedTimeframe] = useState('1m')

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-2 py-1 flex items-center gap-2">
        <div className="text-white font-bold text-sm">Zero.AI</div>

        {/* Scalping Mode Indicator */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-3 py-1 rounded text-white text-xs font-bold">
          ⚡ SCALPING MODE
        </div>

        <div className="relative">
          <Input
            value={symbol}
            onChange={handleSymbolChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search symbol..."
            className="w-48 bg-gray-800 border-gray-700 text-white h-8 text-sm"
          />

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.symbol}
                  onMouseDown={() => selectSuggestion(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-700 border-b border-gray-700 last:border-0"
                >
                  <div className="text-white text-sm font-semibold">{suggestion.symbol}</div>
                  <div className="text-gray-400 text-xs truncate">{suggestion.name}</div>
                  <div className="text-gray-500 text-xs capitalize">{suggestion.market}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs"
        >
          {loading ? '...' : '📊 Load'}
        </Button>

        <Button
          onClick={generateScalpingSignal}
          disabled={generating || totalCandles < 200}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-8 px-3 text-xs font-semibold"
        >
          {generating ? '🤖 Analyzing...' : '🤖 AI Scalp'}
        </Button>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 ml-4 bg-gray-800 rounded p-0.5">
          {['1m', '3m', '5m', '15m'].map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${selectedTimeframe === tf
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Crypto Pairs Dropdown */}
        <div className="relative ml-2">
          <button
            onClick={() => {
              setShowCryptoMenu(!showCryptoMenu)
              setShowForexMenu(false)
            }}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded flex items-center gap-1"
          >
            💎 Crypto ▼
          </button>

          {showCryptoMenu && (
            <div className="absolute top-full left-0 mt-1 w-96 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-50 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1 p-2">
                {cryptoPairs.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSymbol(sym)
                      setShowCryptoMenu(false)
                      setTimeout(loadCandles, 100)
                    }}
                    className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded text-center"
                  >
                    {sym.replace('USD', '')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Forex Pairs Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowForexMenu(!showForexMenu)
              setShowCryptoMenu(false)
            }}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded flex items-center gap-1"
          >
            💱 Forex ▼
          </button>

          {showForexMenu && (
            <div className="absolute top-full left-0 mt-1 w-96 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-50 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1 p-2">
                {forexPairs.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSymbol(sym)
                      setShowForexMenu(false)
                      setTimeout(loadCandles, 100)
                    }}
                    className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded text-center"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scalp Ready Indicator */}
        {scalpingSignal && (
          <div className={`px-3 py-1 rounded text-xs font-bold ${scalpingSignal.readyToScalp
            ? 'bg-green-500 text-white animate-pulse'
            : 'bg-gray-600 text-gray-300'
            }`}>
            {scalpingSignal.readyToScalp
              ? '🎯 SCALP READY - Enter Now!'
              : '⏳ Waiting for Setup...'}
          </div>
        )}

        <div className="text-gray-400 text-xs ml-auto flex items-center gap-2">
          {/* WebSocket Status */}
          <span className={`flex items-center gap-1 ${wsConnected ? 'text-green-500' : 'text-gray-500'}`}>
            <span className={wsConnected ? 'animate-pulse' : ''}>●</span>
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </span>

          {totalCandles > 0 && (
            <>
              <span className="font-semibold">{symbol}</span>
              <span className="text-gray-500">
                🕐 {currentTime.toLocaleTimeString()}
              </span>
              <span className="text-green-500">● {totalCandles} candles</span>
            </>
          )}
        </div>
      </div>

      {/* Single Chart View */}
      <div className="flex-1 relative">
        {candlesData[selectedTimeframe] && candlesData[selectedTimeframe].length > 0 ? (
          <LightweightChart
            data={candlesData[selectedTimeframe]}
            predictions={predictionsData[selectedTimeframe] || []}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">
                {loading ? '📊 Loading chart data...' : '⚡ Select a symbol to start'}
              </div>
              <div className="text-gray-600 text-sm">
                {loading ? `Fetching ${selectedTimeframe} candles...` : 'Choose from Crypto or Forex pairs above'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scalping Signal Display */}
      {scalpingSignal && scalpingSignal.action !== 'WAIT' && (
        <ScalpingSignalDisplay
          signal={scalpingSignal}
          onClose={() => setScalpingSignal(null)}
          onTakeTrade={() => {
            console.log('✅ Taking scalp trade:', scalpingSignal)
            setScalpingSignal(null)
          }}
        />
      )}
    </div>
  )
}
