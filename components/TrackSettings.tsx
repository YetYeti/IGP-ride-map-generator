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
      <label className="text-sm text-gray-600 block mb-1">{label}</label>
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
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 ${
            disabled
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {!disabled && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                const newValue = Math.min(max, value + step)
                setInputValue(newValue.toString())
                onChange(newValue)
              }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">生成选项</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={combinedMap.enabled}
              onChange={() =>
                onCombinedMapChange({
                  ...combinedMap,
                  enabled: !combinedMap.enabled,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm">生成轨迹合成图</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={overlayMap.enabled}
              onChange={() =>
                onOverlayMapChange({
                  ...overlayMap,
                  enabled: !overlayMap.enabled,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm">生成轨迹叠加网页</span>
          </label>
        </div>
      </div>

      {combinedMap.enabled && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">轨迹合成图设置</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-2">布局预设</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(LAYOUT_PRESETS) as [
                  CombinedMapLayoutPreset,
                  (typeof LAYOUT_PRESETS)[CombinedMapLayoutPreset],
                ][]).map(([key, config]) => (
                  <label
                    key={key}
                    className={`flex items-start space-x-2 cursor-pointer p-3 rounded-md border-2 transition-colors ${
                      combinedMap.layoutPreset === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="layoutPreset"
                      checked={combinedMap.layoutPreset === key}
                      onChange={() => handleLayoutPresetChange(key)}
                      className="w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {combinedMap.layoutPreset === 'custom' && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-3 text-gray-700">自定义参数</div>
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
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">地图样式（单选）</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(MapStyleLabels).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="mapStyle"
                  checked={overlayMap.style === key}
                  onChange={() =>
                    onOverlayMapChange({
                      ...overlayMap,
                      style: key as OverlayMapOutputConfig['style'],
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
