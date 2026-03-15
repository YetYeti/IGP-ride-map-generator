'use client'

import React from 'react'
import type {
  CreateGenerationTaskResponse,
  GenerationTask,
  GenerationTaskRequest,
} from '@/lib/generation/types'

const POLL_INTERVAL_MS = 2000

export function useGenerationTask() {
  const [task, setTask] = React.useState<GenerationTask | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [, startTransition] = React.useTransition()
  const pollTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!task || task.status === 'completed' || task.status === 'failed') {
      return
    }

    let cancelled = false

    const pollTask = async () => {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          cache: 'no-store',
        })

        if (response.status === 404) {
          if (!cancelled) {
            setError('任务不存在或已过期')
            startTransition(() => {
              setTask((currentTask) =>
                currentTask
                  ? {
                      ...currentTask,
                      status: 'failed',
                      error: '任务不存在或已过期',
                    }
                  : null
              )
            })
          }
          return
        }

        const nextTask = (await response.json()) as GenerationTask | { error?: string }

        if (!response.ok || !('id' in nextTask)) {
          throw new Error(
            'error' in nextTask && typeof nextTask.error === 'string'
              ? nextTask.error
              : '获取任务状态失败'
          )
        }

        if (cancelled) {
          return
        }

        startTransition(() => {
          setTask(nextTask)
        })

        if (nextTask.status === 'queued' || nextTask.status === 'running') {
          pollTimeoutRef.current = window.setTimeout(pollTask, POLL_INTERVAL_MS)
        }
      } catch (pollError: unknown) {
        if (cancelled) {
          return
        }

        setError(getErrorMessage(pollError))
        pollTimeoutRef.current = window.setTimeout(pollTask, POLL_INTERVAL_MS)
      }
    }

    pollTimeoutRef.current = window.setTimeout(pollTask, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (pollTimeoutRef.current !== null) {
        window.clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
    }
  }, [task?.id, task?.status, startTransition])

  const submitTask = async (request: GenerationTaskRequest) => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }

    setIsCreating(true)
    setError(null)

    startTransition(() => {
      setTask(null)
    })

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = (await response.json()) as CreateGenerationTaskResponse & { error?: string }

      if (!response.ok || !data.task) {
        throw new Error(data.error ?? '创建任务失败')
      }

      startTransition(() => {
        setTask(data.task)
      })
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsCreating(false)
    }
  }

  return {
    task,
    error,
    submitTask,
    loading: isCreating || task?.status === 'queued' || task?.status === 'running',
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '未知错误'
}
