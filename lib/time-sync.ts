// NTP Time Synchronization for accurate trading timestamps

let timeOffset = 0 // Milliseconds offset from accurate time
let lastSync: Date | null = null
let syncInProgress = false

/**
 * Sync with world time API (browser-compatible)
 * Uses multiple fallback sources for reliability
 */
export async function syncTime(): Promise<void> {
  if (syncInProgress) return
  
  syncInProgress = true
  
  // Multiple time sources for reliability
  const timeSources = [
    'https://worldtimeapi.org/api/timezone/Etc/UTC',
    'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
    // If all else fails, trust system clock
  ]
  
  let synced = false
  
  for (const source of timeSources) {
    try {
      const response = await fetch(source, { 
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      
      if (!response.ok) continue
      
      const data = await response.json()
      
      // Handle different API response formats
      let accurateTime: number
      if (data.datetime) {
        // WorldTimeAPI format
        accurateTime = new Date(data.datetime).getTime()
      } else if (data.dateTime) {
        // TimeAPI.io format
        accurateTime = new Date(data.dateTime).getTime()
      } else {
        continue
      }
      
      const systemTime = Date.now()
      timeOffset = accurateTime - systemTime
      lastSync = new Date()
      synced = true
      
      console.log(`⏰ Time synced via ${new URL(source).hostname}`)
      console.log(`   Offset: ${timeOffset}ms (${Math.abs(timeOffset) < 1000 ? 'accurate' : timeOffset > 0 ? 'system behind' : 'system ahead'})`)
      
      break // Success, stop trying other sources
    } catch (error) {
      // Try next source
      continue
    }
  }
  
  if (!synced) {
    console.warn('⚠️ All time sync sources failed - using system time')
    timeOffset = 0
    lastSync = new Date()
  }
  
  syncInProgress = false
}

/**
 * Get accurate current time (time-synchronized)
 */
export function getAccurateTime(): Date {
  return new Date(Date.now() + timeOffset)
}

/**
 * Get time offset in milliseconds
 */
export function getTimeOffset(): number {
  return timeOffset
}

/**
 * Check if time sync is active
 */
export function isSynced(): boolean {
  return lastSync !== null && (Date.now() - lastSync.getTime()) < 60 * 60 * 1000
}

/**
 * Get last sync time
 */
export function getLastSyncTime(): Date | null {
  return lastSync
}

// Auto-sync on load and every hour
if (typeof window !== 'undefined') {
  syncTime()
  setInterval(syncTime, 60 * 60 * 1000)
}

