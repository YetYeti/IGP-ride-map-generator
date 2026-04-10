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

export interface PosterOutputConfig {
  enabled: boolean
  aspectRatio: PosterAspectRatio
}

export interface GenerationTaskRequest {
  credentials: {
    username: string
    password: string
  }
  filters: {
    year: number | 'all'
  }
  outputs: {
    combinedMap: CombinedMapOutputConfig
    overlayMap: OverlayMapOutputConfig
    poster: PosterOutputConfig
  }
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
