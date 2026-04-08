'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { RideForm } from '@/components/RideForm'
import { LogDisplay } from '@/components/LogDisplay'
import { ResultPreview } from '@/components/ResultPreview'
import { useGenerationTask } from '@/hooks/useGenerationTask'
import type { GenerationLogEntry, GenerationTaskRequest } from '@/lib/generation/types'

export default function Home() {
  const { task, error, loading, submitTask } = useGenerationTask()

  const handleSubmit = async (data: GenerationTaskRequest) => {
    await submitTask(data)

    const logDisplayElement = document.getElementById('log-display')
    if (logDisplayElement) {
      logDisplayElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const logs = React.useMemo<GenerationLogEntry[]>(() => {
    if (task) {
      return task.logs
    }

    if (!error) {
      return []
    }

    return [
      {
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        message: error,
        level: 'error',
      },
    ]
  }, [task, error])

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            IGPSPORT 骑行轨迹生成器
          </h1>
          <p className="text-lg text-gray-600">
            从 IGPSPORT 获取骑行数据并生成轨迹合成图和叠加地图
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>输入配置</CardTitle>
              </CardHeader>
              <CardContent>
                <RideForm onSubmit={handleSubmit} loading={loading} />
              </CardContent>
            </Card>

            <LogDisplay id="log-display" logs={logs} />
          </div>

          <div className="space-y-8">
            {task && task.artifacts.length > 0 ? (
              <ResultPreview task={task} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>结果展示</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    生成完成后，轨迹合成图和轨迹叠加网页会显示在这里。
                  </p>
                  <div className="space-y-3">
                    <div className="aspect-[4/3] rounded-md border border-dashed border-gray-300 bg-gray-50" />
                    <div className="aspect-[4/2.5] rounded-md border border-dashed border-gray-300 bg-gray-50" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>© 2026 IGPSPORT 骑行轨迹生成器. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
