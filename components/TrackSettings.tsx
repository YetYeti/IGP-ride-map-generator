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
  togglePoster,
  updateCombinedMapSetting,
  updateOverlayMapStyle,
} from '@/lib/generation/track-settings'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  OverlayMapOutputConfig,
  PosterOutputConfig,
} from '@/lib/generation/types'

interface TrackSettingsProps {
  combinedMap: CombinedMapOutputConfig
  overlayMap: OverlayMapOutputConfig
  poster: PosterOutputConfig
  onCombinedMapChange: (settings: CombinedMapOutputConfig) => void
  onOverlayMapChange: (settings: OverlayMapOutputConfig) => void
  onPosterChange: (settings: PosterOutputConfig) => void
}

export function TrackSettings({
  combinedMap,
  overlayMap,
  poster,
  onCombinedMapChange,
  onOverlayMapChange,
  onPosterChange,
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
        poster={poster}
        onToggleCombinedMap={() => onCombinedMapChange(toggleCombinedMap(combinedMap))}
        onToggleOverlayMap={() => onOverlayMapChange(toggleOverlayMap(overlayMap))}
        onTogglePoster={() => onPosterChange(togglePoster(poster))}
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
