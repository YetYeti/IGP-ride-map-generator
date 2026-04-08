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
      {overlayMaps.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">轨迹叠加网页</h3>
            {overlayMaps.length === 1 && (
              <Button
                size="sm"
                onClick={() => downloadFile(overlayMaps[0].url, overlayMaps[0].filename)}
              >
                下载
              </Button>
            )}
          </div>

          {overlayMaps.map((item, index) => (
            <div key={index} className="space-y-2">
              {overlayMaps.length > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {item.style && MapStyleLabels[item.style]}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => downloadFile(item.url, item.filename)}
                  >
                    下载
                  </Button>
                </div>
              )}
              <iframe
                src={item.url}
                className="aspect-square w-full rounded-lg"
                title={item.filename}
              />
            </div>
          ))}
        </section>
      )}

      {combinedMaps.length > 0 && (
        <section className="space-y-3 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">轨迹合成图</h3>
            {combinedMaps.length === 1 && (
              <Button
                size="sm"
                onClick={() => downloadFile(combinedMaps[0].url, combinedMaps[0].filename)}
              >
                下载
              </Button>
            )}
          </div>

          {combinedMaps.map((item, index) => (
            <div key={index} className="space-y-2">
              {previewImages[item.url] ? (
                <img
                  src={item.url}
                  alt={item.filename}
                  className="h-auto w-full rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-[400px] w-full items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <div>加载中...</div>
                    <div className="mt-2 text-xs">{item.filename}</div>
                  </div>
                </div>
              )}

              {combinedMaps.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => downloadFile(item.url, item.filename)}
                  >
                    下载
                  </Button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
