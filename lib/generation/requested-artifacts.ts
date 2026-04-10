import { generateCombinedMapArtifact } from '@/lib/generation/output-generators/combined-map'
import { generateOverlayMapArtifact } from '@/lib/generation/output-generators/overlay-map'
import { generatePosterArtifact } from '@/lib/generation/output-generators/poster'
import type { GenerationTaskRequest } from '@/lib/generation/types'
import type { Activity } from '@/lib/igpsport'

export async function generateRequestedArtifacts(
  taskId: string,
  request: GenerationTaskRequest,
  processedActivities: Activity[],
  tempDir: string,
  gpsCachePath: string | null
) {
  const jobs: Promise<void>[] = []

  if (request.outputs.overlayMap.enabled && processedActivities.length > 0) {
    jobs.push(
      generateOverlayMapArtifact(
        taskId,
        processedActivities,
        request.outputs.overlayMap,
        tempDir,
        gpsCachePath
      )
    )
  }

  if (request.outputs.combinedMap.enabled && processedActivities.length > 0) {
    jobs.push(
      generateCombinedMapArtifact(
        taskId,
        processedActivities,
        request.outputs.combinedMap,
        tempDir,
        gpsCachePath
      )
    )
  }

  if (request.outputs.poster.enabled && processedActivities.length > 0) {
    jobs.push(
      generatePosterArtifact(taskId, processedActivities, tempDir, gpsCachePath, request.outputs.poster)
    )
  }

  if (jobs.length === 0) {
    return
  }

  const results = await Promise.allSettled(jobs)

  const failures = results.filter((r) => r.status === 'rejected')
  if (failures.length > 0) {
    for (const failure of failures) {
      if (failure.status === 'rejected') {
        console.error(`产物生成异常:`, failure.reason)
      }
    }
  }
}
