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
    <div className="space-y-2">
      <label className="block text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)]">
        {label}
      </label>
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
          className={`h-12 w-full rounded-[18px] border bg-white/75 px-4 py-2 pr-14 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-4 ${
            disabled
              ? 'cursor-not-allowed border-[color:var(--border)] bg-white/45 text-[color:var(--muted-foreground)]'
              : 'border-[color:var(--border)] focus:ring-[color:var(--ring)]'
          }`}
        />
        {!disabled && (
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-[color:var(--border)] bg-white/90 px-1.5 py-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                const newValue = Math.min(max, value + step)
                setInputValue(newValue.toString())
                onChange(newValue)
              }}
              className="rounded-full px-1 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)]"
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
              className="rounded-full px-1 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)]"
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
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--muted-foreground)]">
          输出模式
        </div>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() =>
              onCombinedMapChange({
                ...combinedMap,
                enabled: !combinedMap.enabled,
              })
            }
            className={`w-full rounded-[22px] border p-4 text-left transition-all ${
              combinedMap.enabled
                ? 'border-[color:var(--primary)] bg-[linear-gradient(135deg,rgba(240,91,42,0.15),rgba(255,255,255,0.92))]'
                : 'border-[color:var(--border)] bg-white/45 hover:bg-white/65'
            }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--foreground)]">生成轨迹合成图</div>
                <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  适合导出海报感拼图，突出年度骑行节奏。
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                combinedMap.enabled
                  ? 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)]'
                  : 'bg-white/80 text-[color:var(--muted-foreground)]'
              }`}>
                {combinedMap.enabled ? '开启' : '关闭'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onOverlayMapChange({
                ...overlayMap,
                enabled: !overlayMap.enabled,
              })
            }
            className={`w-full rounded-[22px] border p-4 text-left transition-all ${
              overlayMap.enabled
                ? 'border-emerald-400 bg-[linear-gradient(135deg,rgba(29,90,77,0.12),rgba(255,255,255,0.92))]'
                : 'border-[color:var(--border)] bg-white/45 hover:bg-white/65'
            }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--foreground)]">生成轨迹叠加网页</div>
                <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  适合交互查看轨迹与不同底图样式。
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                overlayMap.enabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/80 text-[color:var(--muted-foreground)]'
              }`}>
                {overlayMap.enabled ? '开启' : '关闭'}
              </span>
            </div>
          </button>
        </div>
      </section>

      {combinedMap.enabled && (
        <section className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-white/40 p-5">
          <div>
            <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--muted-foreground)]">
              合成图设置
            </div>
            <h3 className="mt-2 font-display text-2xl text-[color:var(--foreground)]">版式参数</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-3 block text-sm font-medium text-[color:var(--secondary-foreground)]">
                布局预设
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(Object.entries(LAYOUT_PRESETS) as [
                  CombinedMapLayoutPreset,
                  (typeof LAYOUT_PRESETS)[CombinedMapLayoutPreset],
                ][]).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleLayoutPresetChange(key)}
                    className={`flex items-start gap-3 rounded-[20px] border p-4 text-left transition-all ${
                      combinedMap.layoutPreset === key
                        ? 'border-[color:var(--primary)] bg-[linear-gradient(135deg,rgba(240,91,42,0.12),rgba(255,255,255,0.94))]'
                        : 'border-[color:var(--border)] bg-white/55 hover:bg-white/78'
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-full border ${
                        combinedMap.layoutPreset === key
                          ? 'border-[color:var(--primary)] bg-[color:var(--primary)] ring-4 ring-[color:var(--ring)]'
                          : 'border-[color:var(--border-strong)] bg-white'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[color:var(--foreground)]">{config.label}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted-foreground)]">{config.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {combinedMap.layoutPreset === 'custom' && (
              <div className="border-t border-[color:var(--border)] pt-5">
                <div className="mb-4 text-sm font-medium text-[color:var(--secondary-foreground)]">自定义参数</div>
                <div className="grid gap-4 md:grid-cols-2">
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
        </section>
      )}

      {overlayMap.enabled && (
        <section className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-white/40 p-5">
          <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--muted-foreground)]">
            叠加网页样式
          </div>
          <h3 className="font-display text-2xl text-[color:var(--foreground)]">地图风格</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {mapStyleEntries.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  onOverlayMapChange({
                    ...overlayMap,
                    style: key,
                  })
                }
                className="text-left"
              >
                <div className={`rounded-[20px] border p-4 transition-all ${
                  overlayMap.style === key
                    ? 'border-emerald-500 bg-[linear-gradient(135deg,rgba(29,90,77,0.14),rgba(255,255,255,0.96))]'
                    : 'border-[color:var(--border)] bg-white/55 hover:bg-white/78'
                }`}>
                  <div className="text-sm font-semibold text-[color:var(--foreground)]">{label}</div>
                  <div className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                    {overlayMap.style === key ? '当前选择' : '点击切换到该底图'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
