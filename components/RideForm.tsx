'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TrackSettings } from '@/components/TrackSettings'
import { createInitialTaskRequest } from '@/lib/generation/request'
import type { GenerationTaskRequest } from '@/lib/generation/types'

interface RideFormProps {
  onSubmit: (data: GenerationTaskRequest) => void
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

  const [formData, setFormData] = React.useState<GenerationTaskRequest>(createInitialTaskRequest())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const canSubmit =
    !loading &&
    formData.credentials.username.trim() !== '' &&
    formData.credentials.password.trim() !== ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="IGPSPORT 账号"
        type="text"
        placeholder="请输入您的 IGPSPORT 账号"
        value={formData.credentials.username}
        onChange={(e) => {
          const username = e.currentTarget.value

          setFormData((prev) => ({
            ...prev,
            credentials: {
              ...prev.credentials,
              username,
            },
          }))
        }}
        required
        disabled={loading}
      />

      <Input
        label="密码"
        type="password"
        placeholder="请输入您的密码"
        value={formData.credentials.password}
        onChange={(e) => {
          const password = e.currentTarget.value

          setFormData((prev) => ({
            ...prev,
            credentials: {
              ...prev.credentials,
              password,
            },
          }))
        }}
        required
        disabled={loading}
      />

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">选择年份</label>
        <select
          value={formData.filters.year}
          onChange={(e) => {
            const yearValue = e.currentTarget.value

            setFormData((prev) => ({
              ...prev,
              filters: {
                year: yearValue === 'all' ? 'all' : Number(yearValue),
              },
            }))
          }}
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
        combinedMap={formData.outputs.combinedMap}
        overlayMap={formData.outputs.overlayMap}
        onCombinedMapChange={(combinedMap) =>
          setFormData((prev) => ({
            ...prev,
            outputs: {
              ...prev.outputs,
              combinedMap,
            },
          }))
        }
        onOverlayMapChange={(overlayMap) =>
          setFormData((prev) => ({
            ...prev,
            outputs: {
              ...prev.outputs,
              overlayMap,
            },
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
