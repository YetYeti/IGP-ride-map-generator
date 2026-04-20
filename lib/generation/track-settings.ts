import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  OverlayMapOutputConfig,
  PosterActivityMode,
  PosterAspectRatio,
  PosterOutputConfig,
} from '@/lib/generation/types'

export type CombinedMapSettingField = 'trackWidth' | 'trackSpacing' | 'columns' | 'trackPadding'

export const COMBINED_MAP_CUSTOM_FIELDS = [
  {
    field: 'trackWidth',
    label: '轨迹线条粗细',
    min: 1,
    max: 10,
    step: 1,
  },
  {
    field: 'trackSpacing',
    label: '小图之间间隔（像素）',
    min: 0,
    max: 1000,
    step: 10,
  },
  {
    field: 'columns',
    label: '每行小图数量',
    min: 1,
    max: 10,
    step: 1,
  },
  {
    field: 'trackPadding',
    label: '轨迹周围留白比例',
    min: 0,
    max: 0.5,
    step: 0.05,
  },
] satisfies Array<{
  field: CombinedMapSettingField
  label: string
  min: number
  max: number
  step: number
}>

export const COMBINED_MAP_LAYOUT_PRESETS = {
  compact: {
    label: '紧凑布局',
    description: '更多小图，但轨迹较小',
    settings: {
      trackWidth: 6,
      trackSpacing: 100,
      columns: 7,
      trackPadding: 0.2,
    },
  },
  standard: {
    label: '标准布局',
    description: '平衡效果',
    settings: {
      trackWidth: 8,
      trackSpacing: 300,
      columns: 6,
      trackPadding: 0.1,
    },
  },
  loose: {
    label: '宽松布局',
    description: '轨迹更清晰，但每页小图更少',
    settings: {
      trackWidth: 8,
      trackSpacing: 500,
      columns: 5,
      trackPadding: 0.05,
    },
  },
  custom: {
    label: '自定义',
    description: '手动设置参数',
  },
} satisfies Record<
  CombinedMapLayoutPreset,
  {
    label: string
    description: string
    settings?: Pick<
      CombinedMapOutputConfig,
      'trackWidth' | 'trackSpacing' | 'columns' | 'trackPadding'
    >
  }
>

export function updateCombinedMapSetting(
  combinedMap: CombinedMapOutputConfig,
  field: CombinedMapSettingField,
  value: number
): CombinedMapOutputConfig {
  return {
    ...combinedMap,
    [field]: value,
  }
}

export function applyCombinedMapLayoutPreset(
  combinedMap: CombinedMapOutputConfig,
  preset: CombinedMapLayoutPreset
): CombinedMapOutputConfig {
  if (preset === 'custom') {
    return {
      ...combinedMap,
      layoutPreset: 'custom',
    }
  }

  const presetConfig = COMBINED_MAP_LAYOUT_PRESETS[preset]
  if (!presetConfig.settings) {
    return combinedMap
  }

  return {
    ...combinedMap,
    layoutPreset: preset,
    ...presetConfig.settings,
  }
}

export function toggleCombinedMap(combinedMap: CombinedMapOutputConfig): CombinedMapOutputConfig {
  return {
    ...combinedMap,
    enabled: !combinedMap.enabled,
  }
}

export function toggleOverlayMap(overlayMap: OverlayMapOutputConfig): OverlayMapOutputConfig {
  return {
    ...overlayMap,
    enabled: !overlayMap.enabled,
  }
}

export function updateOverlayMapStyle(
  overlayMap: OverlayMapOutputConfig,
  style: OverlayMapOutputConfig['style']
): OverlayMapOutputConfig {
  return {
    ...overlayMap,
    style,
  }
}

export function togglePoster(poster: PosterOutputConfig): PosterOutputConfig {
  return {
    ...poster,
    enabled: !poster.enabled,
  }
}

export function updatePosterAspectRatio(
  poster: PosterOutputConfig,
  aspectRatio: PosterAspectRatio
): PosterOutputConfig {
  return {
    ...poster,
    aspectRatio,
  }
}

export function updatePosterActivityMode(
  poster: PosterOutputConfig,
  activityMode: PosterActivityMode
): PosterOutputConfig {
  return {
    ...poster,
    activityMode,
  }
}

export function updatePosterSelectedRideId(
  poster: PosterOutputConfig,
  selectedRideId: number | null
): PosterOutputConfig {
  return {
    ...poster,
    selectedRideId,
  }
}
