'use client'

import type {
  CombinedMapOutputConfig,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

interface GenerationOptionsSectionProps {
  combinedMap: CombinedMapOutputConfig
  overlayMap: OverlayMapOutputConfig
  onToggleCombinedMap: () => void
  onToggleOverlayMap: () => void
}

export function GenerationOptionsSection({
  combinedMap,
  overlayMap,
  onToggleCombinedMap,
  onToggleOverlayMap,
}: GenerationOptionsSectionProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-sm font-semibold">生成选项</h3>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="checkbox"
            checked={overlayMap.enabled}
            onChange={onToggleOverlayMap}
            className="h-4 w-4"
          />
          <span className="text-sm">生成轨迹叠加网页</span>
        </label>

        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="checkbox"
            checked={combinedMap.enabled}
            onChange={onToggleCombinedMap}
            className="h-4 w-4"
          />
          <span className="text-sm">生成轨迹合成图</span>
        </label>
      </div>
    </div>
  )
}
