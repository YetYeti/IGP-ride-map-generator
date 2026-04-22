import type { MapStyle } from '@/lib/map-styles'

export type GenerationTaskStatus = 'queued' | 'running' | 'completed' | 'failed'

export type GenerationLogLevel = 'info' | 'success' | 'error' | 'warning'

export type CombinedMapLayoutPreset = 'compact' | 'standard' | 'loose' | 'custom'

export interface GenerationLogEntry {
  timestamp: string
  message: string
  level: GenerationLogLevel
}

export interface GenerationTaskStats {
  totalActivities: number
  outdoorActivities: number
  filteredActivities: number
  processedActivities: number
}

export type GenerationOutputStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed'

export interface GenerationOutputProgress {
  enabled: boolean
  status: GenerationOutputStatus
  progress: number
}

export interface GenerationTaskOutputsProgress {
  combinedMap: GenerationOutputProgress
  overlayMap: GenerationOutputProgress
  poster: GenerationOutputProgress
}

export interface CombinedMapOutputConfig {
  enabled: boolean
  layoutPreset: CombinedMapLayoutPreset
  trackWidth: number
  trackSpacing: number
  columns: number
  trackPadding: number
}

export interface OverlayMapOutputConfig {
  enabled: boolean
  style: MapStyle
}

export type PosterAspectRatio = '9:16' | '3:4' | '1:1' | '4:3' | '16:9'
export type PosterActivityMode = 'all' | 'single'

export interface PosterOutputConfig {
  enabled: boolean
  aspectRatio: PosterAspectRatio
  activityMode: PosterActivityMode
  selectedRideId: number | null
}

export interface PosterActivityOption {
  rideId: number
  label: string
  startTime: string
  startedAt: string
  year: number
  durationText: string
  distanceText: string
}

export type AccountSessionStatus =
  | 'logged_out'
  | 'logging_in'
  | 'loading_activities'
  | 'ready'
  | 'failed'

export interface AccountSessionSummary {
  status: AccountSessionStatus
  username: string | null
  progress: number
  outdoorActivityCount: number
  activities: PosterActivityOption[]
  error: string | null
  updatedAt: string | null
}

export interface AccountSessionResponse {
  session: AccountSessionSummary
}

export interface ActivitySnapshotItem {
  RideId: number
  MemberId: number
  Title: string
  sport: string
  sub_sport: string
  start_time: string
  total_ascent: number
  total_descent: number
  total_calories: number
  total_distance: number
  total_elapsed_time: number
  total_moving_time: number
  avg_cadence: number
  max_cadence: number
  avg_heart_rate: number
  min_heart_rate: number
  max_heart_rate: number
  avg_power: number
  max_power: number
  avg_speed: number
  max_speed: number
  avg_temperature: number
  max_temperature: number
  intensity_factor: number
  normalized_power: number
  training_stress_score: number
}

export interface ActivitySnapshot {
  totalActivityCount: number
  outdoorActivityCount: number
  activities: ActivitySnapshotItem[]
}

export interface AccountLoginResponse extends AccountSessionResponse {
  activitySnapshot: ActivitySnapshot
}

export interface GenerationTaskRequest {
  filters: {
    year: number | 'all'
  }
  outputs: {
    combinedMap: CombinedMapOutputConfig
    overlayMap: OverlayMapOutputConfig
    poster: PosterOutputConfig
  }
}

export interface CreateGenerationTaskPayload {
  request: GenerationTaskRequest
  credentials: {
    username: string
    password: string
  }
  activitySnapshot: ActivitySnapshot
}

export type GenerationArtifactKind = 'combined-map' | 'overlay-map' | 'poster'

export interface GenerationArtifact {
  kind: GenerationArtifactKind
  filename: string
  url: string
  contentType: string
  style?: MapStyle
  createdAt: string
}

export interface GenerationTask {
  id: string
  status: GenerationTaskStatus
  progress: number
  createdAt: string
  updatedAt: string
  logs: GenerationLogEntry[]
  artifacts: GenerationArtifact[]
  stats: GenerationTaskStats
  outputsProgress: GenerationTaskOutputsProgress
  error: string | null
}

export interface CreateGenerationTaskResponse {
  task: GenerationTask
}

export const EMPTY_GENERATION_TASK_STATS: GenerationTaskStats = {
  totalActivities: 0,
  outdoorActivities: 0,
  filteredActivities: 0,
  processedActivities: 0,
}

export const EMPTY_OUTPUT_PROGRESS: GenerationOutputProgress = {
  enabled: false,
  status: 'idle',
  progress: 0,
}
