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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>任务概览</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm text-gray-700">
          <div>全部活动：{task.stats.totalActivities}</div>
          <div>户外骑行：{task.stats.outdoorActivities}</div>
          <div>筛选后活动：{task.stats.filteredActivities}</div>
          <div>成功处理：{task.stats.processedActivities}</div>
        </CardContent>
      </Card>

      {combinedMaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>轨迹合成图</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {combinedMaps.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="relative bg-gray-100 rounded overflow-hidden">
                  {previewImages[item.url] ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <div className="w-full h-[400px] flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div>加载中...</div>
                        <div className="text-xs mt-2">{item.filename}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => downloadFile(item.url, item.filename)}
                  >
                    下载
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {overlayMaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>轨迹叠加网页</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overlayMaps.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {item.style && MapStyleLabels[item.style]}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => downloadFile(item.url, item.filename)}
                  >
                    下载 HTML
                  </Button>
                </div>
                <iframe
                  src={item.url}
                  className="w-full border rounded"
                  style={{ height: '400px' }}
                  title={item.filename}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
