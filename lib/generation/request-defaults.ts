import { MapStyles } from '@/lib/map-styles'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  GenerationTaskRequest,
  OverlayMapOutputConfig,
  PosterAspectRatio,
  PosterOutputConfig,
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
  style: MapStyles.cartodb_positron_nolabels,
}

export const DEFAULT_POSTER_OUTPUT: PosterOutputConfig = {
  enabled: true,
  aspectRatio: '9:16',
  activityMode: 'all',
  selectedRideId: null,
}

export const POSTER_ASPECT_RATIOS: { value: PosterAspectRatio; label: string }[] = [
  { value: '9:16', label: '9:16（竖屏）' },
  { value: '3:4', label: '3:4（竖屏）' },
  { value: '1:1', label: '1:1（方形）' },
  { value: '4:3', label: '4:3（横屏）' },
  { value: '16:9', label: '16:9（横屏）' },
]

export const LAYOUT_PRESETS: CombinedMapLayoutPreset[] = ['compact', 'standard', 'loose', 'custom']

export function createInitialTaskRequest(): GenerationTaskRequest {
  return {
    filters: {
      year: 'all',
    },
    outputs: {
      combinedMap: { ...DEFAULT_COMBINED_MAP_OUTPUT },
      overlayMap: { ...DEFAULT_OVERLAY_MAP_OUTPUT },
      poster: { ...DEFAULT_POSTER_OUTPUT },
    },
  }
}
