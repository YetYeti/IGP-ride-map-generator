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
  progress: number
  outdoorActivityCount: number
  activities: Activity[]
  activityOptions: PosterActivityOption[]
  error: string | null
  updatedAt: string | null
}

const accountSession: AccountSessionState = {
  status: 'logged_out',
  username: null,
  password: null,
  progress: 0,
  outdoorActivityCount: 0,
  activities: [],
  activityOptions: [],
  error: null,
  updatedAt: null,
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

export function getAccountSessionActivities(): Activity[] {
  return [...accountSession.activities]
}

export function beginAccountLogin(username: string, password: string) {
  accountSession.status = 'logging_in'
  accountSession.username = username
  accountSession.password = password
  accountSession.progress = 5
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

export function completeAccountSession(activities: Activity[]) {
  accountSession.status = 'ready'
  accountSession.progress = 100
  accountSession.activities = [...activities]
  accountSession.activityOptions = buildPosterActivityOptions(activities)
  accountSession.outdoorActivityCount = activities.length
  accountSession.error = null
  touchSession()
}

export function failAccountSession(error: string) {
  accountSession.status = 'failed'
  accountSession.progress = 0
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
  accountSession.progress = 0
  accountSession.outdoorActivityCount = 0
  accountSession.activities = []
  accountSession.activityOptions = []
  accountSession.error = null
  touchSession()
}
