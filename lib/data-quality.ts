// Data Quality Monitoring and Freshness Detection

export interface DataQuality {
  isFresh: boolean
  ageMinutes: number
  ageSeconds: number
  status: 'REAL-TIME' | 'DELAYED' | 'STALE' | 'OFFLINE'
  lastUpdate: Date
  warning?: string
  statusColor: string
}

/**
 * Check if data is fresh enough for trading
 */
export function checkDataFreshness(
  lastCandleTimestamp: string,
  timeframe: string
): DataQuality {
  const now = Date.now()
  const lastUpdate = new Date(lastCandleTimestamp).getTime()
  const ageMs = now - lastUpdate
  const ageMinutes = Math.round(ageMs / 60000)
  const ageSeconds = Math.round(ageMs / 1000)
  
  // Expected freshness by timeframe (how old data can be before warning)
  const freshnessThresholds: Record<string, number> = {
    '1m': 2 * 60 * 1000,      // 2 minutes
    '3m': 5 * 60 * 1000,      // 5 minutes
    '5m': 10 * 60 * 1000,     // 10 minutes
    '15m': 20 * 60 * 1000,    // 20 minutes
    '30m': 40 * 60 * 1000,    // 40 minutes
    '1H': 90 * 60 * 1000,     // 90 minutes
    '2H': 150 * 60 * 1000,    // 2.5 hours
    '4H': 300 * 60 * 1000,    // 5 hours
    '1D': 1500 * 60 * 1000,   // 25 hours
    '1W': 10000 * 60 * 1000   // 7 days
  }
  
  const threshold = freshnessThresholds[timeframe] || 90 * 60 * 1000
  
  let status: DataQuality['status']
  let warning: string | undefined
  let statusColor: string
  
  if (ageMs < threshold) {
    status = 'REAL-TIME'
    statusColor = 'text-green-400'
  } else if (ageMs < threshold * 3) {
    status = 'DELAYED'
    statusColor = 'text-yellow-400'
    warning = `Data delayed by ${ageMinutes} minutes`
  } else if (ageMs < 24 * 60 * 60 * 1000) {
    status = 'STALE'
    statusColor = 'text-orange-400'
    warning = `Data is ${ageMinutes} minutes old`
  } else {
    status = 'OFFLINE'
    statusColor = 'text-red-400'
    const days = Math.round(ageMinutes / 60 / 24)
    warning = `Data is ${days} day${days > 1 ? 's' : ''} old`
  }
  
  return {
    isFresh: status === 'REAL-TIME',
    ageMinutes,
    ageSeconds,
    status,
    lastUpdate: new Date(lastCandleTimestamp),
    warning,
    statusColor
  }
}

