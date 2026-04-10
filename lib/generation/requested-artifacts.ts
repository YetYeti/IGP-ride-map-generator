import { generateCombinedMapArtifact } from '@/lib/generation/output-generators/combined-map'
import { generateOverlayMapArtifact } from '@/lib/generation/output-generators/overlay-map'
import type { GenerationTaskRequest } from '@/lib/generation/types'
import type { Activity } from '@/lib/igpsport'

export async function generateRequestedArtifacts(
  taskId: string,
  request: GenerationTaskRequest,
  processedActivities: Activity[],
  tempDir: string
) {
  if (request.outputs.overlayMap.enabled && processedActivities.length > 0) {
    await generateOverlayMapArtifact(taskId, processedActivities, request.outputs.overlayMap, tempDir)
  }

  if (request.outputs.combinedMap.enabled && processedActivities.length > 0) {
    await generateCombinedMapArtifact(
      taskId,
      processedActivities,
      request.outputs.combinedMap,
      tempDir
    )
  }
}
