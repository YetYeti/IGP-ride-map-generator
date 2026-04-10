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
const MAX_POLL_INTERVAL_MS = 30000
const POLL_BACKOFF_FACTOR = 2

export function useGenerationTask() {
  const [task, setTask] = React.useState<GenerationTask | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [, startTransition] = React.useTransition()
  const pollTimeoutRef = React.useRef<number | null>(null)
  const consecutiveErrorsRef = React.useRef(0)

  const clearPollTimeout = React.useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }, [])

  const schedulePoll = React.useCallback((callback: () => void) => {
    const delay = Math.min(
      POLL_INTERVAL_MS * POLL_BACKOFF_FACTOR ** consecutiveErrorsRef.current,
      MAX_POLL_INTERVAL_MS
    )
    pollTimeoutRef.current = window.setTimeout(callback, delay)
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

        consecutiveErrorsRef.current = 0

        if (isTaskActive(nextTask.status)) {
          schedulePoll(pollTask)
        }
      } catch (pollError: unknown) {
        if (cancelled) {
          return
        }

        consecutiveErrorsRef.current += 1
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
    consecutiveErrorsRef.current = 0

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
