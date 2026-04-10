import {
  DEFAULT_COMBINED_MAP_OUTPUT,
  DEFAULT_OVERLAY_MAP_OUTPUT,
  LAYOUT_PRESETS,
} from '@/lib/generation/request-defaults'
import { isRecord, parseNumber } from '@/lib/generation/request-parsing'
import { MapStyles } from '@/lib/map-styles'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

export function parseCombinedMapOutput(value: unknown): CombinedMapOutputConfig | null {
  if (value === undefined) {
    return { ...DEFAULT_COMBINED_MAP_OUTPUT }
  }

  if (!isRecord(value)) {
    return null
  }

  const enabled = typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_COMBINED_MAP_OUTPUT.enabled
  const layoutPreset = isLayoutPreset(value.layoutPreset)
    ? value.layoutPreset
    : DEFAULT_COMBINED_MAP_OUTPUT.layoutPreset
  const trackWidth = parseNumber(value.trackWidth, DEFAULT_COMBINED_MAP_OUTPUT.trackWidth)
  const trackSpacing = parseNumber(value.trackSpacing, DEFAULT_COMBINED_MAP_OUTPUT.trackSpacing)
  const columns = parseNumber(value.columns, DEFAULT_COMBINED_MAP_OUTPUT.columns)
  const trackPadding = parseNumber(value.trackPadding, DEFAULT_COMBINED_MAP_OUTPUT.trackPadding)

  if (
    trackWidth === null ||
    trackSpacing === null ||
    columns === null ||
    trackPadding === null
  ) {
    return null
  }

  return {
    enabled,
    layoutPreset,
    trackWidth,
    trackSpacing,
    columns,
    trackPadding,
  }
}

export function parseOverlayMapOutput(value: unknown): OverlayMapOutputConfig | null {
  if (value === undefined) {
    return { ...DEFAULT_OVERLAY_MAP_OUTPUT }
  }

  if (!isRecord(value)) {
    return null
  }

  const enabled = typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_OVERLAY_MAP_OUTPUT.enabled
  const style = isMapStyle(value.style) ? value.style : DEFAULT_OVERLAY_MAP_OUTPUT.style

  return {
    enabled,
    style,
  }
}

function isMapStyle(value: unknown): value is OverlayMapOutputConfig['style'] {
  return typeof value === 'string' && value in MapStyles
}

function isLayoutPreset(value: unknown): value is CombinedMapLayoutPreset {
  return typeof value === 'string' && LAYOUT_PRESETS.includes(value as CombinedMapLayoutPreset)
}
