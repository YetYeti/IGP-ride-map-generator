export function parseYear(value: unknown): number | 'all' | null {
  if (value === undefined || value === 'all') {
    return 'all'
  }

  if (typeof value === 'number' && Number.isInteger(value) && value > 2000 && value < 3000) {
    return value
  }

  return null
}

export function parseNumber(value: unknown, fallback: number): number | null {
  if (value === undefined) {
    return fallback
  }

  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return null
  }

  return value
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
