import { getTask, appendTaskLog, setTaskCompleted, setTaskFailed } from '@/lib/generation/task-store'
import { markRequestedOutputsFailed } from '@/lib/generation/output-progress'
import type { GenerationTaskRequest } from '@/lib/generation/types'

export function getRequestedArtifactCount(request: GenerationTaskRequest): number {
  return (
    Number(request.outputs.combinedMap.enabled) +
    Number(request.outputs.overlayMap.enabled) +
    Number(request.outputs.poster.enabled)
  )
}

export function failIfNoProcessedActivities(
  taskId: string,
  request: GenerationTaskRequest,
  processedActivityCount: number,
  requestedArtifactCount: number
): boolean {
  if (processedActivityCount > 0 || requestedArtifactCount === 0) {
    return false
  }

  const errorMessage = '没有可用于生成轨迹图的 FIT 文件'
  appendTaskLog(taskId, errorMessage, 'error')
  markRequestedOutputsFailed(taskId, request, 58)
  setTaskFailed(taskId, errorMessage)

  return true
}

export function failIfNoArtifactsGenerated(
  taskId: string,
  request: GenerationTaskRequest,
  requestedArtifactCount: number
): boolean {
  if (requestedArtifactCount === 0) {
    return false
  }

  const task = getTask(taskId)
  if (task && task.artifacts.length > 0) {
    return false
  }

  const errorMessage = '未成功生成任何产物文件'
  appendTaskLog(taskId, errorMessage, 'error')
  markRequestedOutputsFailed(taskId, request, 90)
  setTaskFailed(taskId, errorMessage)

  return true
}

export function completeTaskSuccessfully(taskId: string, processedActivityCount: number) {
  appendTaskLog(taskId, `成功生成${processedActivityCount}个骑行轨迹！`, 'success')
  setTaskCompleted(taskId)
}
