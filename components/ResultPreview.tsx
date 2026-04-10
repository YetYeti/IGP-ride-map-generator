'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import {
  downloadArtifactFile,
  getArtifactsByKind,
  preloadImage,
} from '@/lib/generation/result-preview'
import { MapStyleLabels } from '@/lib/map-styles'
import type { GenerationTask } from '@/lib/generation/types'

interface ResultPreviewProps {
  task: GenerationTask | null
}

export function ResultPreview({ task }: ResultPreviewProps) {
  const [previewImages, setPreviewImages] = React.useState<Record<string, boolean>>({})
  const combinedMaps = React.useMemo(
    () => getArtifactsByKind(task, 'combined-map'),
    [task]
  )
  const overlayMaps = React.useMemo(
    () => getArtifactsByKind(task, 'overlay-map'),
    [task]
  )
  const posters = React.useMemo(
    () => getArtifactsByKind(task, 'poster'),
    [task]
  )

  React.useEffect(() => {
    const imageArtifacts = [...combinedMaps, ...posters]
    if (imageArtifacts.length > 0) {
      imageArtifacts.forEach((artifact) => {
        preloadImage(artifact.url, (url, loaded) => {
          setPreviewImages((prev) => ({ ...prev, [url]: loaded }))
        })
      })
    }
  }, [combinedMaps, posters])

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
                onClick={() => downloadArtifactFile(overlayMaps[0].url, overlayMaps[0].filename)}
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
                    onClick={() => downloadArtifactFile(item.url, item.filename)}
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
        <section className={`space-y-3 ${overlayMaps.length > 0 ? 'border-t border-gray-200 pt-6' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">轨迹合成图</h3>
            {combinedMaps.length === 1 && (
              <Button
                size="sm"
                onClick={() => downloadArtifactFile(combinedMaps[0].url, combinedMaps[0].filename)}
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
                    onClick={() => downloadArtifactFile(item.url, item.filename)}
                  >
                    下载
                  </Button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {posters.length > 0 && (
        <section className={`space-y-3 ${(overlayMaps.length > 0 || combinedMaps.length > 0) ? 'border-t border-gray-200 pt-6' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">轨迹海报</h3>
            {posters.length === 1 && (
              <Button
                size="sm"
                onClick={() => downloadArtifactFile(posters[0].url, posters[0].filename)}
              >
                下载
              </Button>
            )}
          </div>

          {posters.map((item, index) => (
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

              {posters.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => downloadArtifactFile(item.url, item.filename)}
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
