import { writeFileSync } from 'fs'
import { getFitFilePath, hasUsableFitFile } from '@/lib/generation/artifact-service'
import { updateRequestedOutputsProgress } from '@/lib/generation/output-progress'
import { getErrorMessage } from '@/lib/error-utils'
import {
  appendTaskLog,
  setTaskProgress,
} from '@/lib/generation/task-store'
import type { GenerationTaskRequest } from '@/lib/generation/types'
import type { Activity, IGPSPORTClient } from '@/lib/igpsport'

const BATCH_SIZE = 5

export async function downloadFitFilesForActivities(
  taskId: string,
  client: IGPSPORTClient,
  activities: Activity[],
  processedActivities: Activity[],
  request: GenerationTaskRequest
) {
  for (let batchStart = 0; batchStart < activities.length; batchStart += BATCH_SIZE) {
    const batch = activities.slice(batchStart, batchStart + BATCH_SIZE)
    const batchIndex = Math.floor(batchStart / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(activities.length / BATCH_SIZE)

    appendTaskLog(
      taskId,
      `正在处理第 ${batchIndex}/${totalBatches} 批次（${batch.length} 个活动）...`,
      'info'
    )

    const batchResults = await Promise.all(
      batch.map(async (activity) => {
        try {
          const fitFilePath = getFitFilePath(activity.RideId)

          if (hasUsableFitFile(activity.RideId)) {
            appendTaskLog(taskId, `活动 ${activity.RideId} 已存在本地 FIT，跳过下载`, 'info')
            return activity
          }

          const fitFile = await client.downloadFitFile(activity.RideId)
          writeFileSync(fitFilePath, fitFile)
          return activity
        } catch (error: unknown) {
          appendTaskLog(taskId, `处理活动 ${activity.RideId} 失败: ${getErrorMessage(error)}`, 'error')
          return null
        }
      })
    )

    processedActivities.push(
      ...batchResults.filter((activity): activity is Activity => activity !== null)
    )

    const progress = 30 + (processedActivities.length / activities.length) * 40
    setTaskProgress(taskId, progress)
    updateRequestedOutputsProgress(
      taskId,
      request,
      30 + (processedActivities.length / activities.length) * 28,
      'pending'
    )
  }
}
