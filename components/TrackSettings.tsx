'use client'

import React from 'react'
import { Button } from './ui/Button'
import { MapStyle, MapStyleLabels } from '../lib/map-styles'

type LayoutPreset = 'compact' | 'standard' | 'loose' | 'custom'

interface CombinedMapSettings {
  layoutPreset: LayoutPreset
  trackWidth: number
  trackSpacing: number
  columns: number
  trackPadding: number
}

const LAYOUT_PRESETS = {
  compact: {
    label: '紧凑布局',
    description: '更多小图，但轨迹较小',
    settings: {
      trackWidth: 3,
      trackSpacing: 150,
      columns: 8,
      trackPadding: 0.2,
    },
  },
  standard: {
    label: '标准布局',
    description: '平衡效果',
    settings: {
      trackWidth: 4,
      trackSpacing: 300,
      columns: 6,
      trackPadding: 0.1,
    },
  },
  loose: {
    label: '宽松布局',
    description: '轨迹更清晰，但每页小图更少',
    settings: {
      trackWidth: 5,
      trackSpacing: 500,
      columns: 4,
      trackPadding: 0.05,
    },
  },
  custom: {
    label: '自定义',
    description: '手动设置参数',
  },
}

interface TrackSettingsProps {
  overlayMapStyle: MapStyle
  generateCombinedMap: boolean
  generateOverlayMaps: boolean
  combinedMapSettings: CombinedMapSettings
  onSelectMapStyle: (style: MapStyle) => void
  onToggleCombinedMap: () => void
  onToggleOverlayMaps: () => void
  onCombinedMapSettingsChange: (settings: CombinedMapSettings) => void
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
  overlayMapStyle,
  generateCombinedMap,
  generateOverlayMaps,
  combinedMapSettings,
  onSelectMapStyle,
  onToggleCombinedMap,
  onToggleOverlayMaps,
  onCombinedMapSettingsChange,
}: TrackSettingsProps) {
  const handleCombinedMapSettingsChange = (field: keyof CombinedMapSettings, value: number) => {
    onCombinedMapSettingsChange({
      ...combinedMapSettings,
      [field]: value,
    })
  }

  const handleLayoutPresetChange = (preset: LayoutPreset) => {
    if (preset === 'custom') {
      onCombinedMapSettingsChange({
        ...combinedMapSettings,
        layoutPreset: 'custom',
      })
    } else {
      const presetConfig = LAYOUT_PRESETS[preset]
      if (presetConfig && 'settings' in presetConfig) {
        onCombinedMapSettingsChange({
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
              checked={generateCombinedMap}
              onChange={onToggleCombinedMap}
              className="w-4 h-4"
            />
            <span className="text-sm">生成轨迹合成图</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={generateOverlayMaps}
              onChange={onToggleOverlayMaps}
              className="w-4 h-4"
            />
            <span className="text-sm">生成轨迹叠加网页</span>
          </label>
        </div>
      </div>

      {generateCombinedMap && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">轨迹合成图设置</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-2">布局预设</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(LAYOUT_PRESETS) as [LayoutPreset, typeof LAYOUT_PRESETS[LayoutPreset]][]).map(([key, config]) => (
                  <label
                    key={key}
                    className={`flex items-start space-x-2 cursor-pointer p-3 rounded-md border-2 transition-colors ${
                      combinedMapSettings.layoutPreset === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="layoutPreset"
                      checked={combinedMapSettings.layoutPreset === key}
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

            {combinedMapSettings.layoutPreset === 'custom' && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-3 text-gray-700">自定义参数</div>
                <div className="space-y-3">
                  <NumberInput
                    label="轨迹线条粗细"
                    value={combinedMapSettings.trackWidth}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(value) => handleCombinedMapSettingsChange('trackWidth', value)}
                  />
                  <NumberInput
                    label="小图之间间隔（像素）"
                    value={combinedMapSettings.trackSpacing}
                    min={0}
                    max={1000}
                    step={10}
                    onChange={(value) => handleCombinedMapSettingsChange('trackSpacing', value)}
                  />
                  <NumberInput
                    label="每行小图数量"
                    value={combinedMapSettings.columns}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(value) => handleCombinedMapSettingsChange('columns', value)}
                  />
                  <NumberInput
                    label="轨迹周围留白比例"
                    value={combinedMapSettings.trackPadding}
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

      {generateOverlayMaps && (
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
                  checked={overlayMapStyle === key as MapStyle}
                  onChange={() => onSelectMapStyle(key as MapStyle)}
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
