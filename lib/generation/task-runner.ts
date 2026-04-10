import { IGPSPORTClient, type Activity } from '@/lib/igpsport'
import { collectFilteredActivities } from '@/lib/generation/activity-collection'
import {
  appendTaskLog,
  configureTaskOutputs,
  setTaskFailed,
  setTaskProgress,
  setTaskRunning,
  updateTaskStats,
} from '@/lib/generation/task-store'
import { cleanupExpiredFiles, ensureTempDir } from '@/lib/generation/artifact-service'
import { downloadFitFilesForActivities } from '@/lib/generation/fit-downloader'
import { updateRequestedOutputsProgress } from '@/lib/generation/output-progress'
import { getErrorMessage } from '@/lib/generation/python-result'
import { generateRequestedArtifacts } from '@/lib/generation/requested-artifacts'
import {
  completeTaskSuccessfully,
  failIfNoArtifactsGenerated,
  failIfNoProcessedActivities,
  getRequestedArtifactCount,
} from '@/lib/generation/task-outcome'
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
    poster: request.outputs.poster.enabled,
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

  if (failIfNoProcessedActivities(taskId, request, processedActivities.length, requestedArtifactCount)) {
    return
  }

  await generateRequestedArtifacts(taskId, request, processedActivities, tempDir)

  if (failIfNoArtifactsGenerated(taskId, request, requestedArtifactCount)) {
    return
  }

  completeTaskSuccessfully(taskId, processedActivities.length)
}
