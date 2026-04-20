import type { Activity } from '@/lib/igpsport'
import type { PosterActivityOption } from '@/lib/generation/types'

export function buildPosterActivityOptions(activities: Activity[]): PosterActivityOption[] {
  return [...activities]
    .sort((left, right) => right.start_time.getTime() - left.start_time.getTime())
    .map((activity) => {
      const startTime = formatActivityStartTime(activity.start_time)
      const durationText = formatActivityDuration(activity.total_elapsed_time)
      const distanceText = formatActivityDistance(activity.total_distance)

      return {
        rideId: activity.RideId,
        startTime,
        startedAt: activity.start_time.toISOString(),
        year: activity.start_time.getFullYear(),
        durationText,
        distanceText,
        label: `${startTime} ${durationText} ${distanceText}`,
      }
    })
}

export function formatActivityStartTime(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hour = String(value.getHours()).padStart(2, '0')
  const minute = String(value.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

export function formatActivityDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0分'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}时${minutes}分`
  }

  if (minutes > 0) {
    return `${minutes}分`
  }

  return '1分内'
}

export function formatActivityDistance(totalMeters: number): string {
  if (!Number.isFinite(totalMeters) || totalMeters <= 0) {
    return '0 km'
  }

  const kilometers = totalMeters / 1000

  return `${kilometers.toFixed(2)} km`
}
