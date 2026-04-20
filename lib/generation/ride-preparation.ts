import { promises as fs } from 'fs'
import path from 'path'
import { writeFileSync } from 'fs'
import { getFitFilePath, hasUsableFitFile, ensureTempDir } from '@/lib/generation/artifact-service'
import { executePythonScript } from '@/lib/generation/python-runner'
import { parsePythonResult } from '@/lib/generation/python-result'
import { getErrorMessage } from '@/lib/error-utils'
import type { Activity, IGPSPORTClient } from '@/lib/igpsport'

declare global {
  // eslint-disable-next-line no-var
  var __igpsportRidePreparationLocks:
    | {
        fit: Map<number, Promise<void>>
        gps: Map<number, Promise<void>>
      }
    | undefined
}

const preparationLocks = globalThis.__igpsportRidePreparationLocks ?? {
  fit: new Map<number, Promise<void>>(),
  gps: new Map<number, Promise<void>>(),
}

if (!globalThis.__igpsportRidePreparationLocks) {
  globalThis.__igpsportRidePreparationLocks = preparationLocks
}

interface RidePreparationHooks {
  onFitCacheHit?: (rideId: number) => void
  onFitDownloaded?: (rideId: number) => void
  onGpsCacheHit?: (rideId: number) => void
  onGpsCachePrepared?: (rideId: number) => void
  onPreparationFailed?: (rideId: number, error: unknown) => void
}

export async function ensureActivitiesPrepared(
  client: IGPSPORTClient,
  activities: Activity[],
  hooks?: RidePreparationHooks
): Promise<Activity[]> {
  const preparedActivities = await Promise.all(
    activities.map(async (activity) => {
      try {
        await ensureRidePrepared(client, activity.RideId, hooks)
        return activity
      } catch (error: unknown) {
        hooks?.onPreparationFailed?.(activity.RideId, error)
        console.error(`准备活动 ${activity.RideId} 失败:`, getErrorMessage(error))
        return null
      }
    })
  )

  return preparedActivities.filter((activity): activity is Activity => activity !== null)
}

export async function ensureRidePrepared(
  client: IGPSPORTClient,
  rideId: number,
  hooks?: RidePreparationHooks
) {
  await ensureFitReady(client, rideId, hooks)
  await ensurePersistentGpsCacheReady(rideId, hooks)
}

async function ensureFitReady(
  client: IGPSPORTClient,
  rideId: number,
  hooks?: RidePreparationHooks
) {
  if (hasUsableFitFile(rideId)) {
    hooks?.onFitCacheHit?.(rideId)
    return
  }

  await withRideLock(preparationLocks.fit, rideId, async () => {
    if (hasUsableFitFile(rideId)) {
      hooks?.onFitCacheHit?.(rideId)
      return
    }

    const fitFile = await client.downloadFitFile(rideId)
    writeFileSync(getFitFilePath(rideId), fitFile)
    hooks?.onFitDownloaded?.(rideId)
  })
}

async function ensurePersistentGpsCacheReady(
  rideId: number,
  hooks?: RidePreparationHooks
) {
  if (await hasPersistentGpsCache(rideId)) {
    hooks?.onGpsCacheHit?.(rideId)
    return
  }

  await withRideLock(preparationLocks.gps, rideId, async () => {
    if (await hasPersistentGpsCache(rideId)) {
      hooks?.onGpsCacheHit?.(rideId)
      return
    }

    ensureTempDir()

    const scriptPath = path.join(process.cwd(), 'lib/python/extract_gps_cache.py')
    const aggregateCachePath = path.join(
      ensureTempDir(),
      `gps_cache_warmup_${rideId}_${Date.now()}.json`
    )

    try {
      const { stdout } = await executePythonScript(scriptPath, [
        getFitFilePath(rideId),
        aggregateCachePath,
      ])
      const result = parsePythonResult(stdout)

      if (!result.success) {
        throw new Error(result.error || 'GPS 缓存准备失败')
      }

      hooks?.onGpsCachePrepared?.(rideId)
    } finally {
      await fs.rm(aggregateCachePath, { force: true })
    }
  })
}

async function hasPersistentGpsCache(rideId: number): Promise<boolean> {
  try {
    await fs.access(getPersistentGpsCachePath(rideId))
    return true
  } catch {
    return false
  }
}

function getPersistentGpsCachePath(rideId: number): string {
  return path.join(process.cwd(), 'cache', 'gps', `${rideId}.json`)
}

async function withRideLock(
  locks: Map<number, Promise<void>>,
  rideId: number,
  action: () => Promise<void>
) {
  const existing = locks.get(rideId)
  if (existing) {
    await existing
    return
  }

  const promise = (async () => {
    try {
      await action()
    } finally {
      locks.delete(rideId)
    }
  })()

  locks.set(rideId, promise)
  await promise
}
