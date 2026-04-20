'use client'

import React from 'react'
import { CombinedMapLayoutSection } from '@/components/track-settings/CombinedMapLayoutSection'
import { GenerationOptionsSection } from '@/components/track-settings/GenerationOptionsSection'
import { OverlayMapStyleSection } from '@/components/track-settings/OverlayMapStyleSection'
import { PosterActivitySection } from '@/components/track-settings/PosterActivitySection'
import { PosterAspectRatioSection } from '@/components/track-settings/PosterAspectRatioSection'
import {
  applyCombinedMapLayoutPreset,
  type CombinedMapSettingField,
  toggleCombinedMap,
  toggleOverlayMap,
  togglePoster,
  updateCombinedMapSetting,
  updateOverlayMapStyle,
  updatePosterActivityMode,
  updatePosterAspectRatio,
  updatePosterSelectedRideId,
} from '@/lib/generation/track-settings'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  OverlayMapOutputConfig,
  PosterActivityOption,
  PosterOutputConfig,
} from '@/lib/generation/types'

interface TrackSettingsProps {
  combinedMap: CombinedMapOutputConfig
  overlayMap: OverlayMapOutputConfig
  poster: PosterOutputConfig
  posterActivityOptions: PosterActivityOption[]
  posterActivityOptionsLoading: boolean
  posterActivityOptionsError: string | null
  onCombinedMapChange: (settings: CombinedMapOutputConfig) => void
  onOverlayMapChange: (settings: OverlayMapOutputConfig) => void
  onPosterChange: (settings: PosterOutputConfig) => void
}

export function TrackSettings({
  combinedMap,
  overlayMap,
  poster,
  posterActivityOptions,
  posterActivityOptionsLoading,
  posterActivityOptionsError,
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

      {poster.enabled && (
        <>
          <PosterAspectRatioSection
            poster={poster}
            onAspectRatioChange={(aspectRatio) =>
              onPosterChange(updatePosterAspectRatio(poster, aspectRatio))
            }
          />

          <PosterActivitySection
            poster={poster}
            activityOptions={posterActivityOptions}
            activityOptionsLoading={posterActivityOptionsLoading}
            activityOptionsError={posterActivityOptionsError}
            onActivityModeChange={(activityMode) =>
              onPosterChange(updatePosterActivityMode(poster, activityMode))
            }
            onSelectedRideIdChange={(rideId) =>
              onPosterChange(updatePosterSelectedRideId(poster, rideId))
            }
          />
        </>
      )}
    </div>
  )
}
