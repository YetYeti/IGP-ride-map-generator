'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { RideForm } from '@/components/RideForm'
import { ResultPreview } from '@/components/ResultPreview'
import { useGenerationTask } from '@/hooks/useGenerationTask'
import { getLatestTaskMessage, getTaskStatusLabel } from '@/lib/generation/task-display'
import type { GenerationLogEntry, GenerationTaskRequest } from '@/lib/generation/types'

export default function Home() {
  const { task, error, loading, submitTask } = useGenerationTask()

  const handleSubmit = async (data: GenerationTaskRequest) => {
    await submitTask(data)
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

  const statusLabel = getTaskStatusLabel(task, loading)
  const latestMessage = getLatestTaskMessage(task, logs)

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            IGPSPORT 骑行轨迹生成器
          </h1>
          <p className="max-w-2xl text-sm text-gray-600 sm:text-base">
            登录账号、选择年份和输出类型，右侧会持续展示生成进度与结果。
          </p>
        </header>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-gray-200">
                <CardTitle>生成设置</CardTitle>
                <p className="text-sm text-gray-600">
                  填写账号信息并选择输出参数。
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <RideForm onSubmit={handleSubmit} loading={loading} />
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>结果展示</CardTitle>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    {statusLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {latestMessage}
                </p>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {task && task.artifacts.length > 0 ? (
                  <ResultPreview task={task} />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="space-y-3">
                      <div className="aspect-square rounded-md border border-dashed border-gray-300 bg-gray-50" />
                      <div className="aspect-[4/3] rounded-md border border-dashed border-gray-300 bg-gray-50" />
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <div className="text-sm font-medium text-gray-900">轨迹叠加网页</div>
                        <p className="mt-1 text-sm text-gray-600">
                          适合交互查看不同地图样式。
                        </p>
                      </div>
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <div className="text-sm font-medium text-gray-900">轨迹合成图</div>
                        <p className="mt-1 text-sm text-gray-600">
                          适合导出和分享的静态图。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </section>

        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>© 2026 IGPSPORT 骑行轨迹生成器. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
