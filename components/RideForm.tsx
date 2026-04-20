'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TrackSettings } from '@/components/TrackSettings'
import { useCredentialAutofillSync } from '@/hooks/useCredentialAutofillSync'
import { fetchPosterActivityOptions } from '@/lib/generation/task-api'
import {
  getAvailableYears,
  syncRequestCredentials,
  updateRequestCombinedMap,
  updateRequestOverlayMap,
  updateRequestPassword,
  updateRequestPosterRideId,
  updateRequestPoster,
  updateRequestUsername,
  updateRequestYear,
} from '@/lib/generation/request-form'
import { createInitialTaskRequest } from '@/lib/generation/request'
import type { GenerationTaskRequest, PosterActivityOption } from '@/lib/generation/types'
import { getErrorMessage } from '@/lib/error-utils'

interface RideFormProps {
  onSubmit: (data: GenerationTaskRequest) => void
  loading: boolean
}

export function RideForm({ onSubmit, loading }: RideFormProps) {
  const currentYear = new Date().getFullYear()
  const availableYears = React.useMemo(() => getAvailableYears(currentYear), [currentYear])

  const [formData, setFormData] = React.useState<GenerationTaskRequest>(createInitialTaskRequest())
  const [fieldErrors, setFieldErrors] = React.useState({
    username: '',
    password: '',
    posterActivity: '',
  })
  const [posterActivityOptions, setPosterActivityOptions] = React.useState<PosterActivityOption[]>([])
  const [posterActivityOptionsLoading, setPosterActivityOptionsLoading] = React.useState(false)
  const [posterActivityOptionsError, setPosterActivityOptionsError] = React.useState<string | null>(null)
  const usernameInputRef = React.useRef<HTMLInputElement | null>(null)
  const passwordInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleAutofillSync = React.useCallback((username: string, password: string) => {
    setFormData((prev) => syncRequestCredentials(prev, username, password))
  }, [])

  useCredentialAutofillSync({
    usernameInputRef,
    passwordInputRef,
    onSync: handleAutofillSync,
  })

  React.useEffect(() => {
    const requestUsername =
      usernameInputRef.current?.value?.trim() || formData.credentials.username.trim()
    const requestPassword = passwordInputRef.current?.value || formData.credentials.password

    if (!formData.outputs.poster.enabled || formData.outputs.poster.activityMode !== 'single') {
      setPosterActivityOptions([])
      setPosterActivityOptionsLoading(false)
      setPosterActivityOptionsError(null)
      return
    }

    if (requestUsername === '' || requestPassword.trim() === '') {
      setPosterActivityOptions([])
      setPosterActivityOptionsLoading(false)
      setPosterActivityOptionsError('填写账号和密码后才能加载活动列表')
      return
    }

    let cancelled = false

    setPosterActivityOptionsLoading(true)
    setPosterActivityOptionsError(null)

    const timeoutId = window.setTimeout(async () => {
      try {
        const activities = await fetchPosterActivityOptions({
          credentials: {
            username: requestUsername,
            password: requestPassword,
          },
          filters: formData.filters,
        })

        if (cancelled) {
          return
        }

        setPosterActivityOptions(activities)

        const hasSelectedRide = activities.some(
          (activity) => activity.rideId === formData.outputs.poster.selectedRideId
        )

        if (!hasSelectedRide) {
          setFormData((prev) => updateRequestPosterRideId(prev, null))
        }
      } catch (error: unknown) {
        if (cancelled) {
          return
        }

        setPosterActivityOptions([])
        setPosterActivityOptionsError(getErrorMessage(error))
      } finally {
        if (!cancelled) {
          setPosterActivityOptionsLoading(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [
    formData.credentials,
    formData.filters,
    formData.outputs.poster.activityMode,
    formData.outputs.poster.enabled,
    formData.outputs.poster.selectedRideId,
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const username = usernameInputRef.current?.value ?? formData.credentials.username
    const password = passwordInputRef.current?.value ?? formData.credentials.password
    const nextErrors = {
      username: username.trim() === '' ? '请输入账号' : '',
      password: password.trim() === '' ? '请输入密码' : '',
      posterActivity:
        formData.outputs.poster.enabled &&
        formData.outputs.poster.activityMode === 'single' &&
        formData.outputs.poster.selectedRideId === null
          ? '请选择一个活动'
          : '',
    }

    setFieldErrors(nextErrors)

    if (nextErrors.username || nextErrors.password) {
      return
    }

    if (nextErrors.posterActivity) {
      return
    }

    const nextRequest = syncRequestCredentials(formData, username, password)
    setFormData(nextRequest)
    onSubmit(nextRequest)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        ref={usernameInputRef}
        label="IGPSPORT 账号"
        type="text"
        name="username"
        autoComplete="username"
        placeholder="请输入您的 IGPSPORT 账号"
        value={formData.credentials.username}
        onChange={(e) => {
          const username = e.currentTarget.value

          setFieldErrors((prev) => ({ ...prev, username: '' }))
          setFormData((prev) => updateRequestUsername(prev, username))
        }}
        onFocus={() => {
          setFieldErrors((prev) => ({ ...prev, username: '' }))
        }}
        required
        disabled={loading}
      />
      {fieldErrors.username ? (
        <p className="-mt-4 text-sm text-red-600">{fieldErrors.username}</p>
      ) : null}

      <Input
        ref={passwordInputRef}
        label="密码"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="请输入您的密码"
        value={formData.credentials.password}
        onChange={(e) => {
          const password = e.currentTarget.value

          setFieldErrors((prev) => ({ ...prev, password: '' }))
          setFormData((prev) => updateRequestPassword(prev, password))
        }}
        onFocus={() => {
          setFieldErrors((prev) => ({ ...prev, password: '' }))
        }}
        required
        disabled={loading}
      />
      {fieldErrors.password ? (
        <p className="-mt-4 text-sm text-red-600">{fieldErrors.password}</p>
      ) : null}

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
        poster={formData.outputs.poster}
        posterActivityOptions={posterActivityOptions}
        posterActivityOptionsLoading={posterActivityOptionsLoading}
        posterActivityOptionsError={fieldErrors.posterActivity || posterActivityOptionsError}
        onCombinedMapChange={(combinedMap) =>
          setFormData((prev) => updateRequestCombinedMap(prev, combinedMap))
        }
        onOverlayMapChange={(overlayMap) =>
          setFormData((prev) => updateRequestOverlayMap(prev, overlayMap))
        }
        onPosterChange={(poster) =>
          {
            setFieldErrors((current) => ({ ...current, posterActivity: '' }))
            setFormData((prev) => updateRequestPoster(prev, poster))
          }
        }
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? '生成中...' : '生成轨迹'}
      </Button>
    </form>
  )
}
