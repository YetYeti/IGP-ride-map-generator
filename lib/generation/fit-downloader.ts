import { updateRequestedOutputsProgress } from '@/lib/generation/output-progress'
import { getErrorMessage } from '@/lib/error-utils'
import { ensureActivitiesPrepared } from '@/lib/generation/ride-preparation'
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

    const preparedBatch = await ensureActivitiesPrepared(client, batch, {
      onFitCacheHit: (rideId) => {
        appendTaskLog(taskId, `活动 ${rideId} 已存在本地 FIT，跳过下载`, 'info')
      },
      onFitDownloaded: (rideId) => {
        appendTaskLog(taskId, `活动 ${rideId} FIT 下载完成`, 'info')
      },
      onGpsCacheHit: (rideId) => {
        appendTaskLog(taskId, `活动 ${rideId} 已存在 GPS 持久缓存，跳过解析`, 'info')
      },
      onGpsCachePrepared: (rideId) => {
        appendTaskLog(taskId, `活动 ${rideId} GPS 持久缓存已准备完成`, 'info')
      },
      onPreparationFailed: (rideId, error) => {
        appendTaskLog(taskId, `处理活动 ${rideId} 失败: ${getErrorMessage(error)}`, 'error')
      },
    })

    processedActivities.push(...preparedBatch)

    const progress = 30 + (processedActivities.length / activities.length) * 35
    setTaskProgress(taskId, progress)
    updateRequestedOutputsProgress(
      taskId,
      request,
      30 + (processedActivities.length / activities.length) * 28,
      'pending'
    )
  }
}
