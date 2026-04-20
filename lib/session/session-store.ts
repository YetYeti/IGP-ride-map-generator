import { buildPosterActivityOptions } from '@/lib/generation/poster-activity-options'
import type { Activity } from '@/lib/igpsport'
import type {
  AccountSessionStatus,
  AccountSessionSummary,
  PosterActivityOption,
} from '@/lib/generation/types'

interface AccountSessionState {
  status: AccountSessionStatus
  username: string | null
  password: string | null
  warmupRunId: number
  progress: number
  totalActivityCount: number
  outdoorActivityCount: number
  activities: Activity[]
  activityOptions: PosterActivityOption[]
  error: string | null
  updatedAt: string | null
}

declare global {
  // eslint-disable-next-line no-var
  var __igpsportAccountSession: AccountSessionState | undefined
}

function createInitialAccountSessionState(): AccountSessionState {
  return {
    status: 'logged_out',
    username: null,
  password: null,
  warmupRunId: 0,
  progress: 0,
    totalActivityCount: 0,
    outdoorActivityCount: 0,
    activities: [],
    activityOptions: [],
    error: null,
    updatedAt: null,
  }
}

const accountSession =
  globalThis.__igpsportAccountSession ?? createInitialAccountSessionState()

if (!globalThis.__igpsportAccountSession) {
  globalThis.__igpsportAccountSession = accountSession
}

function touchSession() {
  accountSession.updatedAt = new Date().toISOString()
}

export function getAccountSessionSummary(): AccountSessionSummary {
  return {
    status: accountSession.status,
    username: accountSession.username,
    progress: accountSession.progress,
    outdoorActivityCount: accountSession.outdoorActivityCount,
    activities: [...accountSession.activityOptions],
    error: accountSession.error,
    updatedAt: accountSession.updatedAt,
  }
}

export function getAccountSessionCredentials():
  | { username: string; password: string }
  | null {
  if (
    accountSession.status !== 'ready' ||
    !accountSession.username ||
    !accountSession.password
  ) {
    return null
  }

  return {
    username: accountSession.username,
    password: accountSession.password,
  }
}

export function beginWarmupRun(): {
  runId: number
  credentials: { username: string; password: string } | null
  activities: Activity[]
} {
  accountSession.warmupRunId += 1
  touchSession()

  return {
    runId: accountSession.warmupRunId,
    credentials:
      accountSession.username && accountSession.password
        ? {
            username: accountSession.username,
            password: accountSession.password,
          }
        : null,
    activities: [...accountSession.activities],
  }
}

export function isWarmupRunCurrent(runId: number): boolean {
  return accountSession.warmupRunId === runId
}

export function getAccountSessionActivities(): Activity[] {
  return [...accountSession.activities]
}

export function getAccountSessionActivitySnapshot(): {
  totalActivityCount: number
  outdoorActivityCount: number
  activities: Activity[]
} | null {
  if (accountSession.status !== 'ready') {
    return null
  }

  return {
    totalActivityCount: accountSession.totalActivityCount,
    outdoorActivityCount: accountSession.outdoorActivityCount,
    activities: [...accountSession.activities],
  }
}

export function beginAccountLogin(username: string, password: string) {
  accountSession.status = 'logging_in'
  accountSession.username = username
  accountSession.password = password
  accountSession.warmupRunId += 1
  accountSession.progress = 5
  accountSession.totalActivityCount = 0
  accountSession.outdoorActivityCount = 0
  accountSession.activities = []
  accountSession.activityOptions = []
  accountSession.error = null
  touchSession()
}

export function setAccountSessionLoadingActivities(progress: number) {
  accountSession.status = 'loading_activities'
  accountSession.progress = progress
  accountSession.error = null
  touchSession()
}

export function completeAccountSession(
  totalActivityCount: number,
  activities: Activity[]
) {
  accountSession.status = 'ready'
  accountSession.progress = 100
  accountSession.totalActivityCount = totalActivityCount
  accountSession.activities = [...activities]
  accountSession.activityOptions = buildPosterActivityOptions(activities)
  accountSession.outdoorActivityCount = activities.length
  accountSession.error = null
  touchSession()
}

export function failAccountSession(error: string) {
  accountSession.status = 'failed'
  accountSession.progress = 0
  accountSession.warmupRunId += 1
  accountSession.totalActivityCount = 0
  accountSession.outdoorActivityCount = 0
  accountSession.activities = []
  accountSession.activityOptions = []
  accountSession.error = error
  accountSession.password = null
  touchSession()
}

export function clearAccountSession() {
  accountSession.status = 'logged_out'
  accountSession.username = null
  accountSession.password = null
  accountSession.warmupRunId += 1
  accountSession.progress = 0
  accountSession.totalActivityCount = 0
  accountSession.outdoorActivityCount = 0
  accountSession.activities = []
  accountSession.activityOptions = []
  accountSession.error = null
  touchSession()
}
