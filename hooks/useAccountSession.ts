'use client'

import React from 'react'
import { getErrorMessage } from '@/lib/error-utils'
import type {
  AccountSessionResponse,
  AccountSessionSummary,
} from '@/lib/generation/types'

const POLL_INTERVAL_MS = 1500

const EMPTY_SESSION: AccountSessionSummary = {
  status: 'logged_out',
  username: null,
  progress: 0,
  outdoorActivityCount: 0,
  activities: [],
  error: null,
  updatedAt: null,
}

export function useAccountSession() {
  const [session, setSession] = React.useState<AccountSessionSummary>(EMPTY_SESSION)
  const [error, setError] = React.useState<string | null>(null)
  const pollTimeoutRef = React.useRef<number | null>(null)

  const clearPollTimeout = React.useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }, [])

  const fetchSession = React.useCallback(async () => {
    const response = await fetch('/api/session', {
      cache: 'no-store',
    })

    const data = (await response.json()) as AccountSessionResponse & { error?: string }

    if (!response.ok || !data.session) {
      throw new Error(data.error ?? '获取账号会话失败')
    }

    setSession(data.session)
    return data.session
  }, [])

  React.useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const nextSession = await fetchSession()

        if (cancelled) {
          return
        }

        if (
          nextSession.status === 'logging_in' ||
          nextSession.status === 'loading_activities'
        ) {
          pollTimeoutRef.current = window.setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (sessionError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(sessionError))
        }
      }
    }

    void poll()

    return () => {
      cancelled = true
      clearPollTimeout()
    }
  }, [clearPollTimeout, fetchSession])

  const login = React.useCallback(
    async (username: string, password: string) => {
      clearPollTimeout()
      setError(null)

      const response = await fetch('/api/session/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = (await response.json()) as AccountSessionResponse & { error?: string }

      if (!response.ok || !data.session) {
        throw new Error(data.error ?? '账号登录失败')
      }

      setSession(data.session)

      pollTimeoutRef.current = window.setTimeout(async function poll() {
        try {
          const nextSession = await fetchSession()

          if (
            nextSession.status === 'logging_in' ||
            nextSession.status === 'loading_activities'
          ) {
            pollTimeoutRef.current = window.setTimeout(poll, POLL_INTERVAL_MS)
          }
        } catch (sessionError: unknown) {
          setError(getErrorMessage(sessionError))
        }
      }, POLL_INTERVAL_MS)
    },
    [clearPollTimeout, fetchSession]
  )

  const logout = React.useCallback(async () => {
    clearPollTimeout()
    setError(null)

    const response = await fetch('/api/session', {
      method: 'DELETE',
    })

    const data = (await response.json()) as AccountSessionResponse & { error?: string }

    if (!response.ok || !data.session) {
      throw new Error(data.error ?? '退出登录失败')
    }

    setSession(data.session)
  }, [clearPollTimeout])

  return {
    session,
    error,
    login,
    logout,
  }
}
