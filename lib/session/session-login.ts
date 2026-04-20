import { getErrorMessage } from '@/lib/error-utils'
import {
  filterOutdoorActivities,
} from '@/lib/generation/activity-filtering'
import { IGPSPORTClient } from '@/lib/igpsport'
import {
  beginAccountLogin,
  completeAccountSession,
  failAccountSession,
  setAccountSessionLoadingActivities,
} from '@/lib/session/session-store'

let currentLoginRunId = 0

export function startAccountLogin(username: string, password: string) {
  const loginRunId = ++currentLoginRunId

  beginAccountLogin(username, password)

  void runAccountLogin(loginRunId, username, password)
}

async function runAccountLogin(loginRunId: number, username: string, password: string) {
  const client = new IGPSPORTClient()

  try {
    await client.login(username, password)

    setAccountSessionLoadingActivities(15)

    const activities = await client.getAllActivities((page) => {
      if (loginRunId !== currentLoginRunId) {
        return
      }

      setAccountSessionLoadingActivities(Math.min(90, 15 + page * 8))
    })

    if (loginRunId !== currentLoginRunId) {
      return
    }

    const outdoorActivities = filterOutdoorActivities(activities)
    completeAccountSession(outdoorActivities)
  } catch (error: unknown) {
    if (loginRunId !== currentLoginRunId) {
      return
    }

    failAccountSession(getErrorMessage(error))
  }
}
