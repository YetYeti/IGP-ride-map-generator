'use client'

import React from 'react'
import { NumberInput } from '@/components/ui/NumberInput'
import {
  applyCombinedMapLayoutPreset,
  COMBINED_MAP_CUSTOM_FIELDS,
  COMBINED_MAP_LAYOUT_PRESETS,
  type CombinedMapSettingField,
  toggleCombinedMap,
  toggleOverlayMap,
  updateCombinedMapSetting,
  updateOverlayMapStyle,
} from '@/lib/generation/track-settings'
import { MapStyleLabels } from '@/lib/map-styles'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

interface TrackSettingsProps {
  combinedMap: CombinedMapOutputConfig
  overlayMap: OverlayMapOutputConfig
  onCombinedMapChange: (settings: CombinedMapOutputConfig) => void
  onOverlayMapChange: (settings: OverlayMapOutputConfig) => void
}

export function TrackSettings({
  combinedMap,
  overlayMap,
  onCombinedMapChange,
  onOverlayMapChange,
}: TrackSettingsProps) {
  const mapStyleEntries = Object.entries(MapStyleLabels) as [
    OverlayMapOutputConfig['style'],
    string,
  ][]

  const handleCombinedMapSettingsChange = (field: CombinedMapSettingField, value: number) => {
    onCombinedMapChange(updateCombinedMapSetting(combinedMap, field, value))
  }

  const handleLayoutPresetChange = (preset: CombinedMapLayoutPreset) => {
    onCombinedMapChange(applyCombinedMapLayoutPreset(combinedMap, preset))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-sm font-semibold">生成选项</h3>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center space-x-2">
            <input
              type="checkbox"
              checked={overlayMap.enabled}
              onChange={() => onOverlayMapChange(toggleOverlayMap(overlayMap))}
              className="h-4 w-4"
            />
            <span className="text-sm">生成轨迹叠加网页</span>
          </label>

          <label className="flex cursor-pointer items-center space-x-2">
            <input
              type="checkbox"
              checked={combinedMap.enabled}
              onChange={() => onCombinedMapChange(toggleCombinedMap(combinedMap))}
              className="h-4 w-4"
            />
            <span className="text-sm">生成轨迹合成图</span>
          </label>
        </div>
      </div>

      {combinedMap.enabled && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">轨迹合成图布局</h3>
          <div className="space-y-4">
            <div>
              <select
                value={combinedMap.layoutPreset}
                onChange={(e) => handleLayoutPresetChange(e.currentTarget.value as CombinedMapLayoutPreset)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                {(Object.entries(COMBINED_MAP_LAYOUT_PRESETS) as [
                  CombinedMapLayoutPreset,
                  (typeof COMBINED_MAP_LAYOUT_PRESETS)[CombinedMapLayoutPreset],
                ][]).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {COMBINED_MAP_LAYOUT_PRESETS[combinedMap.layoutPreset].description}
              </p>
            </div>

            {combinedMap.layoutPreset === 'custom' && (
              <div className="border-t pt-4">
                <div className="mb-3 text-sm font-medium text-gray-700">自定义参数</div>
                <div className="space-y-3">
                  {COMBINED_MAP_CUSTOM_FIELDS.map((fieldConfig) => (
                    <NumberInput
                      key={fieldConfig.field}
                      label={fieldConfig.label}
                      value={combinedMap[fieldConfig.field]}
                      min={fieldConfig.min}
                      max={fieldConfig.max}
                      step={fieldConfig.step}
                      onChange={(value) => handleCombinedMapSettingsChange(fieldConfig.field, value)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {overlayMap.enabled && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">地图样式</h3>
          <select
            value={overlayMap.style}
            onChange={(e) =>
              onOverlayMapChange(
                updateOverlayMapStyle(
                  overlayMap,
                  e.currentTarget.value as OverlayMapOutputConfig['style']
                )
              )
            }
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {mapStyleEntries.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
