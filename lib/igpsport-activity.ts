import type { Activity } from '@/lib/igpsport-types'

interface ActivityPayload extends Record<string, unknown> {
  RideId?: unknown
  MemberId?: unknown
  Title?: unknown
  RideDistance?: unknown
  RecordTime?: unknown
}

const DATE_FIELDS = ['StartTime', 'startTime', 'start_time', 'BeginTime', 'beginTime', 'Date', 'date']

export function extractActivityItems(result: unknown): ActivityPayload[] {
  if (!isRecord(result)) {
    return []
  }

  // 新接口 /activity/queryMyActivity：数据在 data.rows 中，且字段为 camelCase（如 rideId）。
  // 这里同时兼容旧接口（item 数组）与新旧字段命名。
  const data = result.data
  const rows = isRecord(data) ? data.rows : result.item

  if (!Array.isArray(rows)) {
    return []
  }

  return rows.filter(isRecord)
}

export function mapActivityItem(data: ActivityPayload): Activity {
  const rideId = readNumberField(data, ['RideId', 'rideId'])
  const memberId = readNumberField(data, ['MemberId', 'memberId'])

  return {
    RideId: rideId,
    MemberId: memberId,
    Title: readStringField(data, ['Title', 'title']),
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

function readNumberField(data: Record<string, unknown>, fields: string[]): number {
  for (const field of fields) {
    const value = data[field]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return 0
}

function readStringField(data: Record<string, unknown>, fields: string[]): string {
  for (const field of fields) {
    const value = data[field]
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }

  return ''
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
  const value = readNumberFieldRaw(data, ['RideDistance', 'rideDistance'])
  if (Number.isFinite(value)) {
    return value * 1000
  }

  return 0
}

function parseActivityDuration(data: Record<string, unknown>): number {
  const value = readStringFieldRaw(data, ['RecordTime', 'recordTime'])
  if (value.trim() === '') {
    return 0
  }

  const hours = extractDurationPart(value, /(\d+)\s*时/)
  const minutes = extractDurationPart(value, /(\d+)\s*分/)
  const seconds = extractDurationPart(value, /(\d+)\s*秒/)

  return hours * 3600 + minutes * 60 + seconds
}

function readNumberFieldRaw(data: Record<string, unknown>, fields: string[]): number {
  for (const field of fields) {
    const value = data[field]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return Number.NaN
}

function readStringFieldRaw(data: Record<string, unknown>, fields: string[]): string {
  for (const field of fields) {
    const value = data[field]
    if (typeof value === 'string') {
      return value
    }
  }

  return ''
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
