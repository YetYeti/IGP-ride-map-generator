'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { MapStyle, MapStyleLabels } from '../lib/map-styles'

export interface Result {
  filename: string
  url: string
  style?: MapStyle
}

export interface GenerationResult {
  success: boolean
  totalActivities: number
  outdoorActivities: number
  processedActivities: number
  combinedMaps: Result[]
  overlayMaps: Result[]
}

interface ResultPreviewProps {
  result: GenerationResult | null
}

export function ResultPreview({ result }: ResultPreviewProps) {
  const [previewImages, setPreviewImages] = React.useState<Record<string, boolean>>({})

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
    if (result && result.success) {
      console.log('ResultPreview received result:', result)
      console.log('Combined maps:', result.combinedMaps)
      console.log('Overlay maps:', result.overlayMaps)

      if (result.combinedMaps.length > 0) {
        result.combinedMaps.forEach(map => {
          console.log('Loading image:', map.url)
          loadImage(map.url)
        })
      }
    }
  }, [result])

  if (!result || !result.success) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>处理统计</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{result.totalActivities}</div>
              <div className="text-sm text-gray-600">总活动数</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{result.outdoorActivities}</div>
              <div className="text-sm text-gray-600">户外骑行</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {result.processedActivities}
              </div>
              <div className="text-sm text-gray-600">已处理</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {result.combinedMaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>轨迹合成图</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.combinedMaps.map((item, index) => (
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

      {result.overlayMaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>轨迹叠加网页</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.overlayMaps.map((item, index) => (
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
