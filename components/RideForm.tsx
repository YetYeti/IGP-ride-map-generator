'use client'

import React from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { TrackSettings } from './TrackSettings'
import { MapStyle } from '../lib/map-styles'

interface CombinedMapSettings {
  layoutPreset: 'compact' | 'standard' | 'loose' | 'custom'
  trackWidth: number
  trackSpacing: number
  columns: number
  trackPadding: number
}

interface RideFormData {
  username: string
  password: string
  overlayMapStyle: MapStyle
  generateCombinedMap: boolean
  generateOverlayMaps: boolean
  combinedMapSettings: CombinedMapSettings
  selectedYear: number | 'all'
}

interface RideFormProps {
  onSubmit: (data: RideFormData) => void
  loading: boolean
}

export function RideForm({ onSubmit, loading }: RideFormProps) {
  const currentYear = new Date().getFullYear()
  const availableYears = React.useMemo(() => {
    const years: number[] = []
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i)
    }
    return years
  }, [currentYear])

  const [formData, setFormData] = React.useState<RideFormData>({
    username: '',
    password: '',
    overlayMapStyle: 'default',
    generateCombinedMap: true,
    generateOverlayMaps: true,
    selectedYear: 'all',
    combinedMapSettings: {
      layoutPreset: 'standard',
      trackWidth: 8,
      trackSpacing: 300,
      columns: 6,
      trackPadding: 0.1,
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

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">选择年份</label>
        <select
          value={formData.selectedYear}
          onChange={(e) =>
            setFormData({
              ...formData,
              selectedYear: e.currentTarget.value === 'all' ? 'all' : Number(e.currentTarget.value),
            })
          }
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">全部年份</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year} 年
            </option>
          ))}
        </select>
      </div>

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
