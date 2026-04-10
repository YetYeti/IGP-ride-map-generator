'use client'

import { NumberInput } from '@/components/ui/NumberInput'
import {
  COMBINED_MAP_CUSTOM_FIELDS,
  COMBINED_MAP_LAYOUT_PRESETS,
  type CombinedMapSettingField,
} from '@/lib/generation/track-settings'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
} from '@/lib/generation/types'

const SELECT_CLASS_NAME =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400'

interface CombinedMapLayoutSectionProps {
  combinedMap: CombinedMapOutputConfig
  onLayoutPresetChange: (preset: CombinedMapLayoutPreset) => void
  onSettingChange: (field: CombinedMapSettingField, value: number) => void
}

export function CombinedMapLayoutSection({
  combinedMap,
  onLayoutPresetChange,
  onSettingChange,
}: CombinedMapLayoutSectionProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-sm font-semibold">轨迹合成图布局</h3>
      <div className="space-y-4">
        <div>
          <select
            value={combinedMap.layoutPreset}
            onChange={(e) => onLayoutPresetChange(e.currentTarget.value as CombinedMapLayoutPreset)}
            className={SELECT_CLASS_NAME}
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
                  onChange={(value) => onSettingChange(fieldConfig.field, value)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
