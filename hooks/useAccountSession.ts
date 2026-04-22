'use client'

import React from 'react'
import { getErrorMessage } from '@/lib/error-utils'
import type {
  AccountLoginResponse,
  AccountSessionSummary,
  ActivitySnapshot,
} from '@/lib/generation/types'

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
  const credentialsRef = React.useRef<{ username: string; password: string } | null>(null)
  const activitySnapshotRef = React.useRef<ActivitySnapshot | null>(null)

  const login = React.useCallback(async (username: string, password: string) => {
    setError(null)
    setSession({
      ...EMPTY_SESSION,
      status: 'logging_in',
      username,
      progress: 10,
    })

    try {
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

      const data = (await response.json()) as AccountLoginResponse & { error?: string }

      if (!response.ok || !data.session || !data.activitySnapshot) {
        throw new Error(data.error ?? '账号登录失败')
      }

      credentialsRef.current = { username, password }
      activitySnapshotRef.current = data.activitySnapshot
      setSession(data.session)
    } catch (loginError: unknown) {
      credentialsRef.current = null
      activitySnapshotRef.current = null
      setSession({
        ...EMPTY_SESSION,
        status: 'failed',
        username,
        error: getErrorMessage(loginError),
      })
      setError(getErrorMessage(loginError))
    }
  }, [])

  const logout = React.useCallback(async () => {
    credentialsRef.current = null
    activitySnapshotRef.current = null
    setError(null)
    setSession(EMPTY_SESSION)
  }, [])

  return {
    session,
    error,
    login,
    logout,
    credentials: credentialsRef.current,
    activitySnapshot: activitySnapshotRef.current,
  }
}
