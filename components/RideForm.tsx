'use client'

import React from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { TrackSettings } from './TrackSettings'
import { MapStyle } from '../lib/map-styles'

interface CombinedMapSettings {
  trackWidth: number
  margin: number
  columns: number
}

interface RideFormData {
  username: string
  password: string
  overlayMapStyle: MapStyle
  generateCombinedMap: boolean
  generateOverlayMaps: boolean
  combinedMapSettings: CombinedMapSettings
}

interface RideFormProps {
  onSubmit: (data: RideFormData) => void
  loading: boolean
}

export function RideForm({ onSubmit, loading }: RideFormProps) {
  const [formData, setFormData] = React.useState<RideFormData>({
    username: '',
    password: '',
    overlayMapStyle: 'default',
    generateCombinedMap: true,
    generateOverlayMaps: true,
    combinedMapSettings: {
      trackWidth: 4,
      margin: 300,
      columns: 6,
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const canSubmit = !loading && formData.username.trim() !== '' && formData.password.trim() !== ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="IGPSPORT 账号"
        type="text"
        placeholder="请输入您的 IGPSPORT 账号"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.currentTarget.value })}
        required
        disabled={loading}
      />

      <Input
        label="密码"
        type="password"
        placeholder="请输入您的密码"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
        required
        disabled={loading}
      />

      <TrackSettings
        overlayMapStyle={formData.overlayMapStyle}
        generateCombinedMap={formData.generateCombinedMap}
        generateOverlayMaps={formData.generateOverlayMaps}
        combinedMapSettings={formData.combinedMapSettings}
        onSelectMapStyle={(style) =>
          setFormData({ ...formData, overlayMapStyle: style })
        }
        onToggleCombinedMap={() =>
          setFormData((prev) => ({
            ...prev,
            generateCombinedMap: !prev.generateCombinedMap,
          }))
        }
        onToggleOverlayMaps={() =>
          setFormData((prev) => ({
            ...prev,
            generateOverlayMaps: !prev.generateOverlayMaps,
          }))
        }
        onCombinedMapSettingsChange={(settings) =>
          setFormData((prev) => ({
            ...prev,
            combinedMapSettings: settings,
          }))
        }
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!canSubmit}
      >
        {loading ? '生成中...' : '生成轨迹'}
      </Button>
    </form>
  )
}
