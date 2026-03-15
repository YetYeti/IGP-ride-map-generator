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

  const statusCopy = React.useMemo(() => {
    if (task?.status === 'completed') {
      return {
        label: '已完成',
        description: '结果已经生成，可以直接预览和下载。',
        pillClass: 'border-emerald-200 bg-emerald-100 text-emerald-800',
      }
    }

    if (task?.status === 'failed' || error) {
      return {
        label: '执行失败',
        description: task?.error ?? error ?? '任务执行未完成，请检查日志后重试。',
        pillClass: 'border-rose-200 bg-rose-100 text-rose-800',
      }
    }

    if (loading) {
      return {
        label: '运行中',
        description: '正在获取骑行记录并生成结果，请稍候。',
        pillClass: 'border-amber-200 bg-amber-100 text-amber-800',
      }
    }

    return {
      label: '待启动',
      description: '填入账号后即可开始生成年度骑行海报和叠加网页。',
      pillClass: 'border-[color:var(--border)] bg-white/80 text-[color:var(--secondary-foreground)]',
    }
  }, [task, error, loading])

  const taskStats = [
    { label: '全部活动', value: task?.stats.totalActivities ?? '--' },
    { label: '户外骑行', value: task?.stats.outdoorActivities ?? '--' },
    { label: '筛选结果', value: task?.stats.filteredActivities ?? '--' },
    { label: '成功处理', value: task?.stats.processedActivities ?? '--' },
  ]

  const outputProgressItems = React.useMemo(
    () =>
      [
        {
          key: 'combinedMap',
          label: '轨迹合成图',
          value: task?.outputsProgress?.combinedMap,
          barClass: 'bg-[linear-gradient(90deg,var(--primary),#f8aa5c)]',
        },
        {
          key: 'overlayMap',
          label: '轨迹叠加网页',
          value: task?.outputsProgress?.overlayMap,
          barClass: 'bg-[linear-gradient(90deg,#1d5a4d,#39a78f)]',
        },
      ].filter((item) => item.value?.enabled),
    [task]
  )

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-[color:var(--primary)]/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="grid gap-6 pb-8">
          <div className="space-y-5">
            <span className="eyebrow">IGPSPORT / Ride Composer</span>
            <div className="space-y-2">
              <h1 className="font-display text-[clamp(3.4rem,6vw,4.6rem)] leading-[0.96] tracking-[-0.03em] text-[color:var(--foreground)]">
                <span className="block lg:whitespace-nowrap">
                  <span>把每一次骑行</span>
                  <span className="ml-[0.18em]">编排成一张</span>
                  <span className="ml-[0.18em] text-[color:var(--primary)]">可展示的轨迹作品</span>
                </span>
              </h1>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[color:var(--border)]/80 bg-white/30">
                <span className="eyebrow">参数设置</span>
                <CardTitle>生成设置</CardTitle>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  选择年份、输出类型与版式参数，然后直接开始生成。
                </p>
              </CardHeader>
              <CardContent className="pt-7">
                <RideForm onSubmit={handleSubmit} loading={loading} />
              </CardContent>
            </Card>

            <LogDisplay id="log-display" logs={logs} />
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_360px]">
                  <div className="space-y-5 border-b border-[color:var(--border)] p-7 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="eyebrow">Live Status</span>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusCopy.pillClass}`}>
                        {statusCopy.label}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="max-w-2xl text-sm text-[color:var(--muted-foreground)] sm:text-base">
                        {statusCopy.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {outputProgressItems.length > 0 ? (
                        <div className="space-y-4">
                          {outputProgressItems.map((item) => (
                            <div key={item.key} className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)]">
                                <span>{item.label}</span>
                                <span>{item.value?.progress ?? 0}%</span>
                              </div>
                              <div className="h-3 overflow-hidden rounded-full bg-white/70">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${item.barClass}`}
                                  style={{ width: `${item.value?.progress ?? 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)]">
                            <span>任务进度</span>
                            <span>{task?.progress ?? 0}%</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-white/70">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),#f8aa5c)] transition-all duration-500"
                              style={{ width: `${task?.progress ?? 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 p-7 sm:grid-cols-2 lg:grid-cols-1">
                    {taskStats.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[22px] border border-[color:var(--border)] bg-white/55 p-4"
                      >
                        <div className="text-xs font-semibold tracking-[0.12em] text-[color:var(--muted-foreground)]">
                          {item.label}
                        </div>
                        <div className="mt-3 font-display text-3xl text-[color:var(--foreground)]">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {task?.artifacts.length ? (
              <ResultPreview task={task} />
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="grid gap-6 p-7 lg:grid-cols-[minmax(0,1.1fr)_280px]">
                  <div className="space-y-4">
                    <span className="eyebrow">结果预览</span>
                    <h2 className="font-display text-3xl leading-tight text-[color:var(--foreground)]">
                      生成完成后，这里会显示你的结果
                    </h2>
                    <p className="max-w-2xl text-sm text-[color:var(--muted-foreground)] sm:text-base">
                      合成图和轨迹叠加网页会在这里显示，方便直接查看和下载。
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border-strong)] bg-white/40 p-4">
                      <div className="aspect-[4/3] rounded-[18px] bg-[linear-gradient(135deg,rgba(240,91,42,0.14),rgba(255,255,255,0.72),rgba(19,126,108,0.12))]" />
                    </div>
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border-strong)] bg-white/40 p-4">
                      <div className="aspect-[4/2.4] rounded-[18px] bg-[linear-gradient(135deg,rgba(29,90,77,0.14),rgba(255,255,255,0.7),rgba(240,91,42,0.1))]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <footer className="mt-14 flex flex-col gap-2 border-t border-[color:var(--border)]/80 pt-6 text-sm text-[color:var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 IGPSPORT 骑行轨迹生成器</p>
          <p>年度骑行海报与轨迹网页生成</p>
        </footer>
      </div>
    </main>
  )
}
