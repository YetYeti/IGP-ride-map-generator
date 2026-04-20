'use client'

import type { PosterActivityOption, PosterOutputConfig } from '@/lib/generation/types'

interface PosterActivitySectionProps {
  poster: PosterOutputConfig
  activityOptions: PosterActivityOption[]
  activityOptionsLoading: boolean
  activityOptionsError: string | null
  onSelectionChange: (rideId: number | null) => void
}

export function PosterActivitySection({
  poster,
  activityOptions,
  activityOptionsLoading,
  activityOptionsError,
  onSelectionChange,
}: PosterActivitySectionProps) {
  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">海报活动范围</h3>
      </div>

      <div className="space-y-2">
        <select
          value={poster.activityMode === 'single' ? poster.selectedRideId ?? '' : ''}
          onChange={(e) => {
            const value = e.currentTarget.value
            onSelectionChange(value === '' ? null : Number(value))
          }}
          disabled={activityOptionsLoading}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {activityOptionsLoading ? '正在加载活动列表...' : '全部活动'}
          </option>
          {activityOptions.map((activity) => (
            <option key={activity.rideId} value={activity.rideId}>
              {activity.label}
            </option>
          ))}
        </select>

        {activityOptionsError ? (
          <p className="text-xs text-red-600">{activityOptionsError}</p>
        ) : null}

        {!activityOptionsLoading && !activityOptionsError && activityOptions.length === 0 ? (
          <p className="text-xs text-gray-500">当前账号和筛选条件下没有可选的户外骑行活动。</p>
        ) : null}
      </div>
    </section>
  )
}
