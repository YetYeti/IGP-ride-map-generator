'use client'

import React from 'react'
import { createGenerationTask, fetchGenerationTask } from '@/lib/generation/task-api'
import type { GenerationTask, GenerationTaskRequest } from '@/lib/generation/types'

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
        const nextTask = await fetchGenerationTask(task.id)

        if (nextTask === null) {
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
      const task = await createGenerationTask(request)

      startTransition(() => {
        setTask(task)
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
