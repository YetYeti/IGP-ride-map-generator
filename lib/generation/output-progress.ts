import { updateTaskOutputProgress } from '@/lib/generation/task-store'
import type { GenerationTaskRequest } from '@/lib/generation/types'

export function updateRequestedOutputsProgress(
  taskId: string,
  request: GenerationTaskRequest,
  progress: number,
  status: 'pending' | 'running'
) {
  if (request.outputs.combinedMap.enabled) {
    updateTaskOutputProgress(taskId, 'combinedMap', { progress, status })
  }

  if (request.outputs.overlayMap.enabled) {
    updateTaskOutputProgress(taskId, 'overlayMap', { progress, status })
  }
}

export function markRequestedOutputsFailed(
  taskId: string,
  request: GenerationTaskRequest,
  progress: number
) {
  if (request.outputs.combinedMap.enabled) {
    updateTaskOutputProgress(taskId, 'combinedMap', {
      status: 'failed',
      progress,
    })
  }

  if (request.outputs.overlayMap.enabled) {
    updateTaskOutputProgress(taskId, 'overlayMap', {
      status: 'failed',
      progress,
    })
  }
}
