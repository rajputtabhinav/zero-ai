'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

export interface Candle {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  isPrediction?: boolean
  confidence?: number
}

interface LightweightChartProps {
  data: Candle[]
  predictions?: Candle[]
  width?: number
  height?: number
  onLoadMore?: () => void
}

export interface ChartHandle {
  updateLiveCandle: (candle: Candle) => void
}

export const LightweightChart = forwardRef<ChartHandle, LightweightChartProps>(
  ({ data, predictions = [], width = 1920, height = 1080, onLoadMore }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const candleSeriesRef = useRef<any>(null)
    const volumeSeriesRef = useRef<any>(null)
    const chartInstanceRef = useRef<any>(null)

    // 1. Initialize Chart (Run once)
    useEffect(() => {
      if (!chartContainerRef.current) return

      // Create chart with TradingView styling (v4 API)
      const chart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: '#000000' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        crosshair: {
          mode: 1,
        },
        timeScale: {
          borderColor: '#2b2b43',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#2b2b43',
        },
      })

      // Add candlestick series
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      })

      // Add volume histogram
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      })

      // Configure volume scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.80,
          bottom: 0,
        },
      })

      // Store references
      chartInstanceRef.current = chart
      candleSeriesRef.current = candleSeries
      volumeSeriesRef.current = volumeSeries

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
        chartInstanceRef.current = null
        candleSeriesRef.current = null
        volumeSeriesRef.current = null
      }
    }, []) // Empty dependency array - only run once on mount

    // 2. Update Data (Run when data changes)
    useEffect(() => {
      if (!chartInstanceRef.current || !candleSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return

      // Transform data
      const uniqueData = Array.from(
        new Map(data.map(candle => [candle.timestamp, candle])).values()
      )

      const chartData = uniqueData
        .map((candle) => ({
          time: Math.floor(new Date(candle.timestamp).getTime() / 1000) as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }))
        .sort((a, b) => a.time - b.time)

      const volumeData = uniqueData
        .map((candle) => ({
          time: Math.floor(new Date(candle.timestamp).getTime() / 1000) as any,
          value: candle.volume,
          color: candle.close >= candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        }))
        .sort((a, b) => a.time - b.time)

      // Update series data
      candleSeriesRef.current.setData(chartData)
      volumeSeriesRef.current.setData(volumeData)

      // Handle predictions
      // (Simplified for now, can add back if needed, but main focus is stability)

      // Only fit content if it's the initial load or a full refresh (not incremental update)
      // For now, we'll fit content if data length changed significantly or it's the first load
      // But to keep it simple and avoid jumping, we might only want to fit content on timeframe change.
      // Since we don't know if it's a timeframe change here easily without tracking prev props,
      // we can check if the time range is completely different.
      // For now, let's just fit content.
      // chartInstanceRef.current.timeScale().fitContent() 
      // Actually, fitting content on every update is bad for UX (zooming resets).
      // We should only fit content if we don't have a visible range set?
      // Let's try to fit content only if it's a "fresh" load.

    }, [data]) // Update when data changes

    // 3. Handle Resize/Dimensions
    useEffect(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({ width, height })
      }
    }, [width, height])

    // Expose methods for live updates via ref
    useImperativeHandle(ref, () => ({
      updateLiveCandle: (candle: any) => {
        if (candleSeriesRef.current) {
          // Use time directly if available (WebSocket data), otherwise convert timestamp
          const time = candle.time || Math.floor(new Date(candle.timestamp).getTime() / 1000)
          candleSeriesRef.current.update({
            time: time as any,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          })

          // Update volume too
          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update({
              time: time as any,
              value: candle.volume,
              color: candle.close >= candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
            })
          }

          console.log(`📊 Chart updated with live candle @ ${candle.close}`)
        }
      }
    }))

    return (
      <div className="relative w-full h-full bg-black">
        <div ref={chartContainerRef} className="[&_a[href*='tradingview']]:hidden" />
      </div>
    )
  }
)

LightweightChart.displayName = 'LightweightChart'
