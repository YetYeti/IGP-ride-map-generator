'use client'

import React from 'react'
import { CombinedMapLayoutSection } from '@/components/track-settings/CombinedMapLayoutSection'
import { GenerationOptionsSection } from '@/components/track-settings/GenerationOptionsSection'
import { OverlayMapStyleSection } from '@/components/track-settings/OverlayMapStyleSection'
import {
  applyCombinedMapLayoutPreset,
  type CombinedMapSettingField,
  toggleCombinedMap,
  toggleOverlayMap,
  updateCombinedMapSetting,
  updateOverlayMapStyle,
} from '@/lib/generation/track-settings'
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
  const handleCombinedMapSettingsChange = (field: CombinedMapSettingField, value: number) => {
    onCombinedMapChange(updateCombinedMapSetting(combinedMap, field, value))
  }

  const handleLayoutPresetChange = (preset: CombinedMapLayoutPreset) => {
    onCombinedMapChange(applyCombinedMapLayoutPreset(combinedMap, preset))
  }

  return (
    <div className="space-y-4">
      <GenerationOptionsSection
        combinedMap={combinedMap}
        overlayMap={overlayMap}
        onToggleCombinedMap={() => onCombinedMapChange(toggleCombinedMap(combinedMap))}
        onToggleOverlayMap={() => onOverlayMapChange(toggleOverlayMap(overlayMap))}
      />

      {combinedMap.enabled && (
        <CombinedMapLayoutSection
          combinedMap={combinedMap}
          onLayoutPresetChange={handleLayoutPresetChange}
          onSettingChange={handleCombinedMapSettingsChange}
        />
      )}

      {overlayMap.enabled && (
        <OverlayMapStyleSection
          overlayMap={overlayMap}
          onStyleChange={(style) => onOverlayMapChange(updateOverlayMapStyle(overlayMap, style))}
        />
      )}
    </div>
  )
}
