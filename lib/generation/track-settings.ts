import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

export type CombinedMapSettingField = 'trackWidth' | 'trackSpacing' | 'columns' | 'trackPadding'

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
