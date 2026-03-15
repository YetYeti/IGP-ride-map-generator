'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MapStyleLabels } from '@/lib/map-styles'
import type { GenerationTask } from '@/lib/generation/types'

interface ResultPreviewProps {
  task: GenerationTask | null
}

export function ResultPreview({ task }: ResultPreviewProps) {
  const [previewImages, setPreviewImages] = React.useState<Record<string, boolean>>({})
  const combinedMaps = React.useMemo(
    () => task?.artifacts.filter((artifact) => artifact.kind === 'combined-map') ?? [],
    [task]
  )
  const overlayMaps = React.useMemo(
    () => task?.artifacts.filter((artifact) => artifact.kind === 'overlay-map') ?? [],
    [task]
  )

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading:', url, filename)

      const response = await fetch(url)
      if (!response.ok) {
        console.error('Download failed:', response.status)
        alert(`下载失败: ${response.status}`)
        return
      }

      const blob = await response.blob()
      console.log('Blob type:', blob.type, 'Size:', blob.size)

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      console.log('Download initiated')
    } catch (error: any) {
      console.error('Download error:', error)
      alert(`下载出错: ${error.message}`)
    }
  }

  const loadImage = (url: string) => {
    const img = new Image()
    img.onload = () => {
      setPreviewImages(prev => ({ ...prev, [url]: true }))
    }
    img.onerror = () => {
      console.error('Failed to load image:', url)
      setPreviewImages(prev => ({ ...prev, [url]: false }))
    }
    img.src = url
  }

  React.useEffect(() => {
    if (combinedMaps.length > 0) {
      combinedMaps.forEach((map) => {
        loadImage(map.url)
      })
    }
  }, [combinedMaps])

  if (!task || task.artifacts.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-[color:var(--border)] bg-white/35">
          <span className="eyebrow">结果概览</span>
          <CardTitle>任务概览</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-7 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-[color:var(--border)] bg-white/65 p-4">
            <div className="text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)]">全部活动</div>
            <div className="mt-3 font-display text-3xl">{task.stats.totalActivities}</div>
          </div>
          <div className="rounded-[22px] border border-[color:var(--border)] bg-white/65 p-4">
            <div className="text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)]">户外骑行</div>
            <div className="mt-3 font-display text-3xl">{task.stats.outdoorActivities}</div>
          </div>
          <div className="rounded-[22px] border border-[color:var(--border)] bg-white/65 p-4">
            <div className="text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)]">筛选后活动</div>
            <div className="mt-3 font-display text-3xl">{task.stats.filteredActivities}</div>
          </div>
          <div className="rounded-[22px] border border-[color:var(--border)] bg-white/65 p-4">
            <div className="text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)]">成功处理</div>
            <div className="mt-3 font-display text-3xl">{task.stats.processedActivities}</div>
          </div>
        </CardContent>
      </Card>

      {combinedMaps.length > 0 && (
        <Card>
          <CardHeader className="border-b border-[color:var(--border)] bg-white/35">
            <span className="eyebrow">合成图预览</span>
            <CardTitle>轨迹合成图</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-7">
            {combinedMaps.map((item, index) => (
              <div key={index} className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-white/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--foreground)]">{item.filename}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">点击右侧可下载原图</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => downloadFile(item.url, item.filename)}
                  >
                    下载 PNG
                  </Button>
                </div>
                <div className="relative">
                  {previewImages[item.url] ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-auto w-full rounded-[18px] object-contain"
                    />
                  ) : (
                    <div className="flex h-[400px] w-full items-center justify-center rounded-[18px] bg-white/55">
                      <div className="text-center text-[color:var(--muted-foreground)]">
                        <div>加载中...</div>
                        <div className="mt-2 text-xs">{item.filename}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {overlayMaps.length > 0 && (
        <Card>
          <CardHeader className="border-b border-[color:var(--border)] bg-white/35">
            <span className="eyebrow">网页预览</span>
            <CardTitle>轨迹叠加网页</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-7">
            {overlayMaps.map((item, index) => (
              <div key={index} className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-white/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-[color:var(--foreground)]">
                      {item.style && MapStyleLabels[item.style]}
                    </span>
                    <div className="text-xs text-[color:var(--muted-foreground)]">{item.filename}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(item.url, item.filename)}
                  >
                    下载 HTML
                  </Button>
                </div>
                <div className="overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-white">
                  <iframe
                    src={item.url}
                    className="w-full bg-white"
                    style={{ height: '420px' }}
                    title={item.filename}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
