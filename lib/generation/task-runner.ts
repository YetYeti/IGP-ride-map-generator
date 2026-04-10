import { IGPSPORTClient, type Activity } from '@/lib/igpsport'
import { collectFilteredActivities } from '@/lib/generation/activity-collection'
import {
  appendTaskLog,
  configureTaskOutputs,
  getTask,
  setTaskCompleted,
  setTaskFailed,
  setTaskProgress,
  setTaskRunning,
  updateTaskStats,
} from '@/lib/generation/task-store'
import { cleanupExpiredFiles, ensureTempDir } from '@/lib/generation/artifact-service'
import { downloadFitFilesForActivities } from '@/lib/generation/fit-downloader'
import { markRequestedOutputsFailed, updateRequestedOutputsProgress } from '@/lib/generation/output-progress'
import { getErrorMessage } from '@/lib/generation/python-result'
import { generateCombinedMapArtifact } from '@/lib/generation/output-generators/combined-map'
import { generateOverlayMapArtifact } from '@/lib/generation/output-generators/overlay-map'
import type { GenerationTaskRequest } from '@/lib/generation/types'

export function startTaskRun(taskId: string, request: GenerationTaskRequest) {
  void runTask(taskId, request).catch((error: unknown) => {
    const errorMessage = getErrorMessage(error)
    console.error('任务执行失败:', error)
    appendTaskLog(taskId, `处理失败: ${errorMessage}`, 'error')
    setTaskFailed(taskId, errorMessage)
  })
}

async function runTask(taskId: string, request: GenerationTaskRequest) {
  const client = new IGPSPORTClient()
  const tempDir = ensureTempDir()
  const processedActivities: Activity[] = []
  const requestedArtifactCount = getRequestedArtifactCount(request)

  setTaskRunning(taskId)
  configureTaskOutputs(taskId, {
    combinedMap: request.outputs.combinedMap.enabled,
    overlayMap: request.outputs.overlayMap.enabled,
  })
  appendTaskLog(taskId, '开始生成轨迹...', 'info')
  updateRequestedOutputsProgress(taskId, request, 5, 'pending')

  cleanupExpiredFiles()

  const filteredActivities = await collectFilteredActivities(taskId, client, request)
  if (!filteredActivities) {
    return
  }

  await downloadFitFilesForActivities(taskId, client, filteredActivities, processedActivities, request)

  updateTaskStats(taskId, {
    processedActivities: processedActivities.length,
  })

  appendTaskLog(taskId, `成功处理 ${processedActivities.length} 个活动`, 'success')
  setTaskProgress(taskId, 70)
  updateRequestedOutputsProgress(taskId, request, 58, 'pending')

  if (processedActivities.length === 0 && requestedArtifactCount > 0) {
    const errorMessage = '没有可用于生成轨迹图的 FIT 文件'
    appendTaskLog(taskId, errorMessage, 'error')
    markRequestedOutputsFailed(taskId, request, 58)
    setTaskFailed(taskId, errorMessage)
    return
  }

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

  if (requestedArtifactCount > 0) {
    const task = getTask(taskId)
    if (!task || task.artifacts.length === 0) {
      const errorMessage = '未成功生成任何产物文件'
      appendTaskLog(taskId, errorMessage, 'error')
      markRequestedOutputsFailed(taskId, request, 90)
      setTaskFailed(taskId, errorMessage)
      return
    }
  }

  appendTaskLog(taskId, `成功生成${processedActivities.length}个骑行轨迹！`, 'success')
  setTaskCompleted(taskId)
}

function getRequestedArtifactCount(request: GenerationTaskRequest): number {
  return Number(request.outputs.combinedMap.enabled) + Number(request.outputs.overlayMap.enabled)
}
