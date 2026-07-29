'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

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

interface CandlestickChartProps {
  data: Candle[]
  predictions?: Candle[]
  width?: number
  height?: number
  showPredictions?: boolean
}

export function CandlestickChart({
  data,
  predictions = [],
  width = 1200,
  height = 600,
  showPredictions = true
}: CandlestickChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 80, bottom: 30, left: 80 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Combine data and predictions
    const allData = showPredictions ? [...data, ...predictions] : data
    const dataOnly = data

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(allData.map((d, i) => i.toString()))
      .range([0, chartWidth])
      .padding(0.3)

    const yScale = d3
      .scaleLinear()
      .domain([
        (d3.min(allData, d => d.low) || 0) * 0.998,
        (d3.max(allData, d => d.high) || 100000) * 1.002
      ] as [number, number])
      .range([chartHeight, 0])

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      )
      .attr('stroke', '#333')
      .attr('stroke-opacity', 0.3)

    // X axis with better date formatting
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3.axisBottom(xScale)
          .tickValues(
            xScale.domain().filter((_, i) => i % Math.ceil(allData.length / 10) === 0)
          )
          .tickFormat((d) => {
            const index = parseInt(d)
            if (allData[index]) {
              const date = new Date(allData[index].timestamp)
              const hours = date.getHours().toString().padStart(2, '0')
              const minutes = date.getMinutes().toString().padStart(2, '0')
              const month = (date.getMonth() + 1).toString().padStart(2, '0')
              const day = date.getDate().toString().padStart(2, '0')
              return `${month}/${day} ${hours}:${minutes}`
            }
            return ''
          })
      )
      .selectAll('text')
      .attr('fill', 'white')
      .style('font-size', '11px')

    // Y axis with better formatting
    g.append('g')
      .call(d3.axisLeft(yScale)
        .ticks(10)
        .tickFormat(d => `$${d.toLocaleString()}`)
      )
      .selectAll('text')
      .attr('fill', 'white')
      .style('font-size', '11px')

    // Vertical separator line between real and predicted
    if (showPredictions && predictions.length > 0) {
      g.append('line')
        .attr('x1', xScale((dataOnly.length - 1).toString())!)
        .attr('x2', xScale((dataOnly.length - 1).toString())!)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
    }

    // Draw candlesticks
    allData.forEach((d, i) => {
      const isPredicted = i >= dataOnly.length
      const x = xScale(i.toString()) || 0
      const bandWidth = xScale.bandwidth()

      // Candle body
      const bodyHeight = Math.abs(yScale(d.open) - yScale(d.close))
      const bodyY = Math.min(yScale(d.open), yScale(d.close))
      const isUp = d.close > d.open

      g.append('rect')
        .attr('x', x)
        .attr('y', bodyY)
        .attr('width', bandWidth)
        .attr('height', Math.max(bodyHeight, 1))
        .attr('fill', isPredicted 
          ? (isUp ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)')
          : (isUp ? '#22c55e' : '#ef4444')
        )
        .attr('stroke', isPredicted ? '#fbbf24' : 'none')
        .attr('stroke-width', isPredicted ? 1 : 0)
        .attr('opacity', d.confidence ? d.confidence : 1)

      // Wicks
      g.append('line')
        .attr('x1', x + bandWidth / 2)
        .attr('x2', x + bandWidth / 2)
        .attr('y1', yScale(d.high))
        .attr('y2', yScale(d.low))
        .attr('stroke', isPredicted 
          ? (isUp ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)')
          : (isUp ? '#22c55e' : '#ef4444')
        )
        .attr('stroke-width', 1)
        .attr('opacity', d.confidence ? d.confidence : 1)
    })

    // Removed legend for minimal UI

  }, [data, predictions, width, height, showPredictions])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="bg-black"
    />
  )
}

