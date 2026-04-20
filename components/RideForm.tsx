'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { TrackSettings } from '@/components/TrackSettings'
import {
  getAvailableYears,
  updateRequestCombinedMap,
  updateRequestOverlayMap,
  updateRequestPoster,
  updateRequestPosterRideId,
  updateRequestYear,
} from '@/lib/generation/request-form'
import { createInitialTaskRequest } from '@/lib/generation/request'
import type {
  GenerationTaskRequest,
  PosterActivityOption,
} from '@/lib/generation/types'

interface RideFormProps {
  onSubmit: (data: GenerationTaskRequest) => void
  loading: boolean
  accountReady: boolean
  posterActivityOptions: PosterActivityOption[]
}

export function RideForm({
  onSubmit,
  loading,
  accountReady,
  posterActivityOptions,
}: RideFormProps) {
  const currentYear = new Date().getFullYear()
  const availableYears = React.useMemo(() => getAvailableYears(currentYear), [currentYear])

  const [formData, setFormData] = React.useState<GenerationTaskRequest>(createInitialTaskRequest())
  const [fieldErrors, setFieldErrors] = React.useState({
    posterActivity: '',
  })

  const filteredPosterActivities = React.useMemo(() => {
    if (formData.filters.year === 'all') {
      return posterActivityOptions
    }

    return posterActivityOptions.filter((activity) => activity.year === formData.filters.year)
  }, [formData.filters.year, posterActivityOptions])

  React.useEffect(() => {
    if (
      formData.outputs.poster.activityMode !== 'single' ||
      formData.outputs.poster.selectedRideId === null
    ) {
      return
    }

    const hasSelectedRide = filteredPosterActivities.some(
      (activity) => activity.rideId === formData.outputs.poster.selectedRideId
    )

    if (!hasSelectedRide) {
      setFormData((prev) => updateRequestPosterRideId(prev, null))
    }
  }, [
    filteredPosterActivities,
    formData.outputs.poster.activityMode,
    formData.outputs.poster.selectedRideId,
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors = {
      posterActivity:
        formData.outputs.poster.enabled &&
        formData.outputs.poster.activityMode === 'single' &&
        formData.outputs.poster.selectedRideId === null
          ? '请选择一个活动'
          : '',
    }

    setFieldErrors(nextErrors)

    if (nextErrors.posterActivity) {
      return
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">选择年份</label>
        <select
          value={formData.filters.year}
          onChange={(e) => {
            const yearValue = e.currentTarget.value

            setFieldErrors((prev) => ({ ...prev, posterActivity: '' }))
            setFormData((prev) =>
              updateRequestYear(prev, yearValue === 'all' ? 'all' : Number(yearValue))
            )
          }}
          disabled={loading || !accountReady}
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
        poster={formData.outputs.poster}
        posterActivityOptions={filteredPosterActivities}
        posterActivityOptionsLoading={!accountReady}
        posterActivityOptionsError={fieldErrors.posterActivity}
        onCombinedMapChange={(combinedMap) =>
          setFormData((prev) => updateRequestCombinedMap(prev, combinedMap))
        }
        onOverlayMapChange={(overlayMap) =>
          setFormData((prev) => updateRequestOverlayMap(prev, overlayMap))
        }
        onPosterChange={(poster) => {
          setFieldErrors((current) => ({ ...current, posterActivity: '' }))
          setFormData((prev) => updateRequestPoster(prev, poster))
        }}
      />

      {!accountReady ? (
        <p className="text-sm text-amber-700">请先登录账号并完成活动获取后再生成。</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading || !accountReady}
      >
        {loading ? '生成中...' : '生成轨迹'}
      </Button>
    </form>
  )
}
