import type { Activity } from '@/lib/igpsport-types'

interface ActivityPayload extends Record<string, unknown> {
  RideId?: unknown
  MemberId?: unknown
  Title?: unknown
  RideDistance?: unknown
  RecordTime?: unknown
}

const DATE_FIELDS = ['StartTime', 'start_time', 'BeginTime', 'beginTime', 'Date', 'date']

export function extractActivityItems(result: unknown): ActivityPayload[] {
  if (!isRecord(result)) {
    return []
  }

  const items = result.item
  if (!Array.isArray(items)) {
    return []
  }

  return items.filter(isRecord)
}

export function mapActivityItem(data: ActivityPayload): Activity {
  return {
    RideId: typeof data.RideId === 'number' ? data.RideId : 0,
    MemberId: typeof data.MemberId === 'number' ? data.MemberId : 0,
    Title: typeof data.Title === 'string' ? data.Title : '',
    sport: 'None',
    sub_sport: 'None',
    start_time: parseActivityDate(data),
    total_ascent: 0,
    total_descent: 0,
    total_calories: 0,
    total_distance: parseActivityDistance(data),
    total_elapsed_time: parseActivityDuration(data),
    total_moving_time: parseActivityDuration(data),
    avg_cadence: 0,
    max_cadence: 0,
    avg_heart_rate: 0,
    min_heart_rate: 0,
    max_heart_rate: 0,
    avg_power: 0,
    max_power: 0,
    avg_speed: 0,
    max_speed: 0,
    avg_temperature: 0,
    max_temperature: 0,
    intensity_factor: 0,
    normalized_power: 0,
    training_stress_score: 0,
  }
}

function parseActivityDate(data: Record<string, unknown>): Date {
  for (const field of DATE_FIELDS) {
    const value = data[field]
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value)
    }
  }

  return new Date()
}

function parseActivityDistance(data: Record<string, unknown>): number {
  const value = data.RideDistance
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value * 1000
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed * 1000
    }
  }

  return 0
}

function parseActivityDuration(data: Record<string, unknown>): number {
  const value = data.RecordTime
  if (typeof value !== 'string' || value.trim() === '') {
    return 0
  }

  const hours = extractDurationPart(value, /(\d+)\s*时/)
  const minutes = extractDurationPart(value, /(\d+)\s*分/)
  const seconds = extractDurationPart(value, /(\d+)\s*秒/)

  return hours * 3600 + minutes * 60 + seconds
}

function extractDurationPart(value: string, pattern: RegExp): number {
  const match = value.match(pattern)
  if (!match) {
    return 0
  }

  return Number.parseInt(match[1], 10) || 0
}

function isRecord(value: unknown): value is ActivityPayload {
  return typeof value === 'object' && value !== null
}
