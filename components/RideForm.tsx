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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div className="rounded-[22px] border border-[color:var(--border)] bg-white/40 p-4">
          <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--muted-foreground)]">
            账号信息
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            账号信息仅当前任务使用，不会进行存储。
          </p>
        </div>

        <div className="grid gap-4">
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
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--muted-foreground)]">
          年份筛选
        </div>
        <div className="rounded-[22px] border border-[color:var(--border)] bg-white/55 p-4">
          <label className="mb-2 block text-sm font-medium text-[color:var(--secondary-foreground)]">
            选择年份
          </label>
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
            className="flex h-12 w-full rounded-[18px] border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-2 text-sm text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">全部年份</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year} 年
              </option>
            ))}
          </select>
        </div>
      </section>

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

      <div className="rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(240,91,42,0.1),rgba(255,255,255,0.68),rgba(19,126,108,0.08))] p-4">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? '正在生成轨迹作品' : '开始生成'}
        </Button>
      </div>
    </form>
  )
}
