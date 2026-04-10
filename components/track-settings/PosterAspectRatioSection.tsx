'use client'

import { POSTER_ASPECT_RATIOS } from '@/lib/generation/request-defaults'
import type { PosterOutputConfig } from '@/lib/generation/types'

const SELECT_CLASS_NAME =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400'

interface PosterAspectRatioSectionProps {
  poster: PosterOutputConfig
  onAspectRatioChange: (aspectRatio: PosterOutputConfig['aspectRatio']) => void
}

export function PosterAspectRatioSection({
  poster,
  onAspectRatioChange,
}: PosterAspectRatioSectionProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">海报比例</h3>
      <select
        value={poster.aspectRatio}
        onChange={(e) =>
          onAspectRatioChange(e.currentTarget.value as PosterOutputConfig['aspectRatio'])
        }
        className={SELECT_CLASS_NAME}
      >
        {POSTER_ASPECT_RATIOS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
