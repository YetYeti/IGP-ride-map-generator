import { IGPSPORTClient, type Activity } from '@/lib/igpsport'
import {
  appendTaskLog,
  configureTaskOutputs,
  getTask,
  setTaskCompleted,
  setTaskFailed,
  updateTaskOutputProgress,
  setTaskProgress,
  setTaskRunning,
  updateTaskStats,
} from '@/lib/generation/task-store'
import {
  cleanupExpiredFiles,
  ensureTempDir,
} from '@/lib/generation/artifact-service'
import { downloadFitFilesForActivities } from '@/lib/generation/fit-downloader'
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

    appendTaskLog(taskId, '正在登录 IGPSPORT...', 'info')
    await client.login(request.credentials.username, request.credentials.password)
    appendTaskLog(taskId, '登录成功', 'success')
    setTaskProgress(taskId, 10)
    updateRequestedOutputsProgress(taskId, request, 12, 'pending')

    const activities = await client.getAllActivities((page) => {
      appendTaskLog(taskId, `正在获取第 ${page} 页活动...`, 'info')
      setTaskProgress(taskId, Math.min(25, 10 + page * 2))
      updateRequestedOutputsProgress(taskId, request, Math.min(24, 12 + page * 2), 'pending')
    })

    const outdoorActivities = activities.filter((activity) => activity.Title !== '室内骑行')
    const filteredActivities = filterActivitiesByYear(outdoorActivities, request.filters.year)

    updateTaskStats(taskId, {
      totalActivities: activities.length,
      outdoorActivities: outdoorActivities.length,
      filteredActivities: filteredActivities.length,
    })

    if (filteredActivities.length === 0) {
      const yearLabel = request.filters.year === 'all' ? '当前筛选条件' : `${request.filters.year} 年`
      const errorMessage = `${yearLabel}没有户外骑行数据，请选择其他年份或“全部年份”`
      appendTaskLog(taskId, `${yearLabel}没有户外骑行数据`, 'error')
      setTaskFailed(taskId, errorMessage)
      return
    }

    filteredActivities.sort((left, right) => left.RideId - right.RideId)
    appendTaskLog(taskId, `找到 ${filteredActivities.length} 个户外骑行`, 'info')
    setTaskProgress(taskId, 30)
    updateRequestedOutputsProgress(taskId, request, 30, 'pending')

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

function updateRequestedOutputsProgress(
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

function markRequestedOutputsFailed(
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

function filterActivitiesByYear(activities: Activity[], selectedYear: number | 'all'): Activity[] {
  if (selectedYear === 'all') {
    return [...activities]
  }

  return activities.filter((activity) => activity.start_time.getFullYear() === selectedYear)
}

function getRequestedArtifactCount(request: GenerationTaskRequest): number {
  return Number(request.outputs.combinedMap.enabled) + Number(request.outputs.overlayMap.enabled)
}
