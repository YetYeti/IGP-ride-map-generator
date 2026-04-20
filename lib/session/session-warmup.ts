import { promises as fs } from 'fs'
import path from 'path'
import { writeFileSync } from 'fs'
import { getErrorMessage } from '@/lib/error-utils'
import { getFitFilePath, hasUsableFitFile } from '@/lib/generation/artifact-service'
import { executePythonScript } from '@/lib/generation/python-runner'
import { parsePythonResult } from '@/lib/generation/python-result'
import { ensureTempDir } from '@/lib/generation/artifact-service'
import { IGPSPORTClient, type Activity } from '@/lib/igpsport'
import {
  beginWarmupRun,
  isWarmupRunCurrent,
} from '@/lib/session/session-store'

const WARMUP_BATCH_SIZE = 3

export function startSessionWarmup() {
  const snapshot = beginWarmupRun()
  if (!snapshot.credentials || snapshot.activities.length === 0) {
    return
  }

  void runSessionWarmup(snapshot.runId, snapshot.credentials, snapshot.activities).catch(
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
  ensureTempDir()

  const client = new IGPSPORTClient()
  await client.login(credentials.username, credentials.password)

  for (let batchStart = 0; batchStart < activities.length; batchStart += WARMUP_BATCH_SIZE) {
    if (!isWarmupRunCurrent(runId)) {
      return
    }

    const batch = activities.slice(batchStart, batchStart + WARMUP_BATCH_SIZE)

    await Promise.all(
      batch.map(async (activity) => {
        if (!isWarmupRunCurrent(runId)) {
          return
        }

        try {
          await ensureFitFile(client, activity.RideId)
          await ensurePersistentGpsCache(activity.RideId)
        } catch (error: unknown) {
          console.error(`后台预热活动 ${activity.RideId} 失败:`, getErrorMessage(error))
        }
      })
    )
  }
}

async function ensureFitFile(client: IGPSPORTClient, rideId: number) {
  if (hasUsableFitFile(rideId)) {
    return
  }

  const fitFile = await client.downloadFitFile(rideId)
  writeFileSync(getFitFilePath(rideId), fitFile)
}

async function ensurePersistentGpsCache(rideId: number) {
  const gpsCachePath = path.join(process.cwd(), 'cache', 'gps', `${rideId}.json`)

  try {
    await fs.access(gpsCachePath)
    return
  } catch {
    // ignore missing cache
  }

  const scriptPath = path.join(process.cwd(), 'lib/python/extract_gps_cache.py')
  const aggregateCachePath = path.join(
    ensureTempDir(),
    `gps_cache_warmup_${rideId}_${Date.now()}.json`
  )

  try {
    const { stdout } = await executePythonScript(
      scriptPath,
      [getFitFilePath(rideId), aggregateCachePath]
    )
    const result = parsePythonResult(stdout)

    if (!result.success) {
      throw new Error(result.error || 'GPS 预热失败')
    }
  } finally {
    await fs.rm(aggregateCachePath, { force: true })
  }
}
