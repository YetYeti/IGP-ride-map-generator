'use client'

import { MapStyleLabels } from '@/lib/map-styles'
import type { OverlayMapOutputConfig } from '@/lib/generation/types'

const SELECT_CLASS_NAME =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400'

interface OverlayMapStyleSectionProps {
  overlayMap: OverlayMapOutputConfig
  onStyleChange: (style: OverlayMapOutputConfig['style']) => void
}

export function OverlayMapStyleSection({
  overlayMap,
  onStyleChange,
}: OverlayMapStyleSectionProps) {
  const mapStyleEntries = Object.entries(MapStyleLabels) as [
    OverlayMapOutputConfig['style'],
    string,
  ][]

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">地图样式</h3>
      <select
        value={overlayMap.style}
        onChange={(e) => onStyleChange(e.currentTarget.value as OverlayMapOutputConfig['style'])}
        className={SELECT_CLASS_NAME}
      >
        {mapStyleEntries.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
