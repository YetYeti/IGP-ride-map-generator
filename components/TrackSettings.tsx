'use client'

import React from 'react'
import { MapStyleLabels } from '@/lib/map-styles'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

type CombinedMapSettingField = 'trackWidth' | 'trackSpacing' | 'columns' | 'trackPadding'

const LAYOUT_PRESETS = {
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
}

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
    const num = Number(inputValue)
    if (isNaN(num)) {
      setInputValue(value.toString())
    } else {
      const clamped = Math.max(min, Math.min(max, num))
      setInputValue(clamped.toString())
      onChange(clamped)
    }
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
                const newValue = Math.min(max, value + step)
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
                const newValue = Math.max(min, value - step)
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
    onCombinedMapChange({
      ...combinedMap,
      [field]: value,
    })
  }

  const handleLayoutPresetChange = (preset: CombinedMapLayoutPreset) => {
    if (preset === 'custom') {
      onCombinedMapChange({
        ...combinedMap,
        layoutPreset: 'custom',
      })
    } else {
      const presetConfig = LAYOUT_PRESETS[preset]
      if (presetConfig && 'settings' in presetConfig) {
        onCombinedMapChange({
          ...combinedMap,
          layoutPreset: preset,
          ...presetConfig.settings,
        })
      }
    }
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
              onChange={() =>
                onOverlayMapChange({
                  ...overlayMap,
                  enabled: !overlayMap.enabled,
                })
              }
              className="h-4 w-4"
            />
            <span className="text-sm">生成轨迹叠加网页</span>
          </label>

          <label className="flex cursor-pointer items-center space-x-2">
            <input
              type="checkbox"
              checked={combinedMap.enabled}
              onChange={() =>
                onCombinedMapChange({
                  ...combinedMap,
                  enabled: !combinedMap.enabled,
                })
              }
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
                {(Object.entries(LAYOUT_PRESETS) as [
                  CombinedMapLayoutPreset,
                  (typeof LAYOUT_PRESETS)[CombinedMapLayoutPreset],
                ][]).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {LAYOUT_PRESETS[combinedMap.layoutPreset].description}
              </p>
            </div>

            {combinedMap.layoutPreset === 'custom' && (
              <div className="border-t pt-4">
                <div className="mb-3 text-sm font-medium text-gray-700">自定义参数</div>
                <div className="space-y-3">
                  <NumberInput
                    label="轨迹线条粗细"
                    value={combinedMap.trackWidth}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(value) => handleCombinedMapSettingsChange('trackWidth', value)}
                  />
                  <NumberInput
                    label="小图之间间隔（像素）"
                    value={combinedMap.trackSpacing}
                    min={0}
                    max={1000}
                    step={10}
                    onChange={(value) => handleCombinedMapSettingsChange('trackSpacing', value)}
                  />
                  <NumberInput
                    label="每行小图数量"
                    value={combinedMap.columns}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(value) => handleCombinedMapSettingsChange('columns', value)}
                  />
                  <NumberInput
                    label="轨迹周围留白比例"
                    value={combinedMap.trackPadding}
                    min={0}
                    max={0.5}
                    step={0.05}
                    onChange={(value) => handleCombinedMapSettingsChange('trackPadding', value)}
                  />
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
              onOverlayMapChange({
                ...overlayMap,
                style: e.currentTarget.value as OverlayMapOutputConfig['style'],
              })
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
