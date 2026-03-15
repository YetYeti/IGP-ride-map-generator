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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            IGPSPORT 骑行轨迹生成器
          </h1>
          <p className="text-gray-600 text-lg">
            从 IGPSPORT 获取骑行数据并生成轨迹合成图和叠加地图
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card>
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
            <ResultPreview task={task} />
          </div>
        </div>

        <footer className="text-center mt-16 text-sm text-gray-500">
          <p>© 2026 IGPSPORT 骑行轨迹生成器. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
