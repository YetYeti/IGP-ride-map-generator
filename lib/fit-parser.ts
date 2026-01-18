export interface GPSData {
  lat: number
  long: number
}

export interface SessionData {
  sport: string
  sub_sport: string
  start_time: Date
  total_distance: number
  total_elapsed_time: number
  total_moving_time: number
  total_ascent: number
  total_descent: number
  total_calories: number
  avg_speed: number
  max_speed: number
  avg_cadence: number
  max_cadence: number
  avg_heart_rate: number
  min_heart_rate: number
  max_heart_rate: number
  avg_power: number
  max_power: number
  avg_temperature: number
  max_temperature: number
  intensity_factor: number
  normalized_power: number
  training_stress_score: number
}

export interface ParsedFitData {
  gpsData: GPSData[]
  sessionData: SessionData | null
}

export class FitParser {
  async parse(fitFile: Buffer): Promise<ParsedFitData> {
    const result = await fetch('/api/parse-fit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(fitFile) as any,
    })

    if (!result.ok) {
      throw new Error('FIT 文件解析失败')
    }

    return result.json()
  }

  async extractGPSData(fitFile: Buffer): Promise<GPSData[]> {
    const data = await this.parse(fitFile)
    return data.gpsData
  }
}

export const MapStyles = {
  default: 'default',
  cartodb_positron: 'cartodb_positron',
  cartodb_positron_nolabels: 'cartodb_positron_nolabels',
  cartodb_darkmatter: 'cartodb_darkmatter',
  cartodb_darkmatter_nolabels: 'cartodb_darkmatter_nolabels',
} as const

export type MapStyle = (typeof MapStyles)[keyof typeof MapStyles]

export const MapStyleLabels: Record<MapStyle, string> = {
  default: '默认样式',
  cartodb_positron: '浅色地图（含标签）',
  cartodb_positron_nolabels: '浅色地图（无标签）',
  cartodb_darkmatter: '深色地图（含标签）',
  cartodb_darkmatter_nolabels: '深色地图（无标签）',
}
