'use client'

import React from 'react'
import { getErrorMessage } from '@/lib/error-utils'
import { createGenerationTask, fetchGenerationTask } from '@/lib/generation/task-api'
import {
  isTaskActive,
  isTaskTerminal,
  markTaskAsExpired,
  TASK_EXPIRED_ERROR,
} from '@/lib/generation/task-status'
import type { GenerationTask, GenerationTaskRequest } from '@/lib/generation/types'

const POLL_INTERVAL_MS = 2000

export function useGenerationTask() {
  const [task, setTask] = React.useState<GenerationTask | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [, startTransition] = React.useTransition()
  const pollTimeoutRef = React.useRef<number | null>(null)

  const clearPollTimeout = React.useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }, [])

  const schedulePoll = React.useCallback((callback: () => void) => {
    pollTimeoutRef.current = window.setTimeout(callback, POLL_INTERVAL_MS)
  }, [])

  React.useEffect(() => {
    if (!task || isTaskTerminal(task.status)) {
      return
    }

    let cancelled = false

    const pollTask = async () => {
      try {
        const nextTask = await fetchGenerationTask(task.id)

        if (nextTask === null) {
          if (!cancelled) {
            setError(TASK_EXPIRED_ERROR)
            startTransition(() => {
              setTask((currentTask) => markTaskAsExpired(currentTask))
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

        if (isTaskActive(nextTask.status)) {
          schedulePoll(pollTask)
        }
      } catch (pollError: unknown) {
        if (cancelled) {
          return
        }

        setError(getErrorMessage(pollError))
        schedulePoll(pollTask)
      }
    }

    schedulePoll(pollTask)

    return () => {
      cancelled = true
      clearPollTimeout()
    }
  }, [clearPollTimeout, schedulePoll, task?.id, task?.status, startTransition])

  const submitTask = async (request: GenerationTaskRequest) => {
    clearPollTimeout()

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
    loading: isCreating || isTaskActive(task?.status),
  }
}
