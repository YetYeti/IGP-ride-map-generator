import { MapStyles } from '@/lib/map-styles'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  GenerationTaskRequest,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

export const DEFAULT_COMBINED_MAP_OUTPUT: CombinedMapOutputConfig = {
  enabled: true,
  layoutPreset: 'standard',
  trackWidth: 8,
  trackSpacing: 300,
  columns: 6,
  trackPadding: 0.1,
}

export const DEFAULT_OVERLAY_MAP_OUTPUT: OverlayMapOutputConfig = {
  enabled: true,
  style: MapStyles.default,
}

export const LAYOUT_PRESETS: CombinedMapLayoutPreset[] = ['compact', 'standard', 'loose', 'custom']

export function createInitialTaskRequest(): GenerationTaskRequest {
  return {
    credentials: {
      username: '',
      password: '',
    },
    filters: {
      year: 'all',
    },
    outputs: {
      combinedMap: { ...DEFAULT_COMBINED_MAP_OUTPUT },
      overlayMap: { ...DEFAULT_OVERLAY_MAP_OUTPUT },
    },
  }
}
