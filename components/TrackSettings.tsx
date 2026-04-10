'use client'

import React from 'react'
import {
  applyCombinedMapLayoutPreset,
  COMBINED_MAP_CUSTOM_FIELDS,
  COMBINED_MAP_LAYOUT_PRESETS,
  type CombinedMapSettingField,
  normalizeNumberInputValue,
  stepNumberInputValue,
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

interface NumberInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
}

function NumberInput({ label, value, min, max, step = 1, disabled = false, onChange }: NumberInputProps) {
  const [inputValue, setInputValue] = React.useState<string>(value.toString())

  React.useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleBlur = () => {
    const normalizedValue = normalizeNumberInputValue(inputValue, value, min, max)
    setInputValue(normalizedValue.inputValue)
    onChange(normalizedValue.value)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-full rounded-md border px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${
            disabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {!disabled && (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                const newValue = stepNumberInputValue(value, min, max, step, 'up')
                setInputValue(newValue.toString())
                onChange(newValue)
              }}
              className="cursor-pointer text-gray-400 hover:text-gray-600"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => {
                const newValue = stepNumberInputValue(value, min, max, step, 'down')
                setInputValue(newValue.toString())
                onChange(newValue)
              }}
              className="cursor-pointer text-gray-400 hover:text-gray-600"
            >
              ▼
            </button>
          </div>
        )}
      </div>
    </div>
  )
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
