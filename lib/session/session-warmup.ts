import { getErrorMessage } from '@/lib/error-utils'
import { ensureActivitiesPrepared } from '@/lib/generation/ride-preparation'
import { IGPSPORTClient, type Activity } from '@/lib/igpsport'

const WARMUP_BATCH_SIZE = 3
let currentWarmupRunId = 0

export function startSessionWarmup(
  credentials: { username: string; password: string },
  activities: Activity[]
) {
  if (activities.length === 0) {
    return
  }

  const runId = ++currentWarmupRunId

  void runSessionWarmup(runId, credentials, activities).catch(
    (error: unknown) => {
      console.error('后台预热失败:', getErrorMessage(error))
    }
  )
}

async function runSessionWarmup(
  runId: number,
  credentials: { username: string; password: string },
  activities: Activity[]
) {
  const client = new IGPSPORTClient()
  await client.login(credentials.username, credentials.password)

  for (let batchStart = 0; batchStart < activities.length; batchStart += WARMUP_BATCH_SIZE) {
    if (runId !== currentWarmupRunId) {
      return
    }

    const batch = activities.slice(batchStart, batchStart + WARMUP_BATCH_SIZE)

    await Promise.all(
      batch.map(async (activity) => {
        if (runId !== currentWarmupRunId) {
          return
        }

        try {
          await ensureActivitiesPrepared(client, [activity], {
            onPreparationFailed: (rideId, error) => {
              console.error(`后台预热活动 ${rideId} 失败:`, getErrorMessage(error))
            },
          })
        } catch (error: unknown) {
          console.error(`后台预热活动 ${activity.RideId} 失败:`, getErrorMessage(error))
        }
      })
    )
  }
}
