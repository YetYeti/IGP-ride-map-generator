import { writeFileSync } from 'fs'
import path from 'path'
import { IGPSPORTClient, type Activity } from '@/lib/igpsport'
import {
  addTaskArtifact,
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
  buildArtifactUrl,
  cleanupExpiredFiles,
  cleanupFitFiles,
  ensureTempDir,
} from '@/lib/generation/artifact-service'
import { executePythonScript } from '@/lib/generation/python-runner'
import type {
  CombinedMapOutputConfig,
  GenerationTaskRequest,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

const BATCH_SIZE = 5

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

  try {
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

    await downloadFitFiles(taskId, client, filteredActivities, tempDir, processedActivities, request)

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

    if (request.outputs.combinedMap.enabled && processedActivities.length > 0) {
      await generateCombinedMap(taskId, processedActivities, request.outputs.combinedMap, tempDir)
    }

    if (request.outputs.overlayMap.enabled && processedActivities.length > 0) {
      await generateOverlayMap(taskId, processedActivities, request.outputs.overlayMap, tempDir)
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
  } finally {
    cleanupFitFiles(processedActivities.map((activity) => activity.RideId))
  }
}

async function downloadFitFiles(
  taskId: string,
  client: IGPSPORTClient,
  activities: Activity[],
  tempDir: string,
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
          const fitFile = await client.downloadFitFile(activity.RideId)
          const fitFilePath = path.join(tempDir, `${activity.RideId}.fit`)
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

async function generateCombinedMap(
  taskId: string,
  processedActivities: Activity[],
  output: CombinedMapOutputConfig,
  tempDir: string
) {
  appendTaskLog(taskId, '正在生成轨迹合成图...', 'info')
  updateTaskOutputProgress(taskId, 'combinedMap', {
    status: 'running',
    progress: 72,
  })

  const scriptPath = path.join(process.cwd(), 'lib/python/generate_combined_map.py')
  const filename = `combined_map_${taskId}.png`
  const outputPath = path.join(tempDir, filename)
  const fitFilePaths = processedActivities.map((activity) => path.join(tempDir, `${activity.RideId}.fit`))

  const args = [
    ...fitFilePaths,
    outputPath,
    '--track-width',
    output.trackWidth.toString(),
    '--track-spacing',
    output.trackSpacing.toString(),
    '--columns',
    output.columns.toString(),
    '--track-padding',
    output.trackPadding.toString(),
  ]

  try {
    const { stdout } = await executePythonScript(scriptPath, args, (message) => {
      appendTaskLog(taskId, message, 'info')
    })
    const pythonResult = parsePythonResult(stdout)

    if (!pythonResult.success) {
      appendTaskLog(taskId, `生成轨迹合成图失败: ${pythonResult.error}`, 'error')
      updateTaskOutputProgress(taskId, 'combinedMap', {
        status: 'failed',
        progress: 72,
      })
      return
    }

    addTaskArtifact(taskId, {
      kind: 'combined-map',
      filename,
      url: buildArtifactUrl(taskId, filename),
      contentType: 'image/png',
    })

    appendTaskLog(
      taskId,
      `轨迹合成图已生成: ${filename} (${pythonResult.totalTracks ?? processedActivities.length} 个轨迹${pythonResult.gridSize ? `，${pythonResult.gridSize}` : ''})`,
      'success'
    )
    updateTaskOutputProgress(taskId, 'combinedMap', {
      status: 'completed',
      progress: 100,
    })
    setTaskProgress(taskId, 85)
  } catch (error: unknown) {
    appendTaskLog(taskId, `生成轨迹合成图失败: ${getErrorMessage(error)}`, 'error')
    updateTaskOutputProgress(taskId, 'combinedMap', {
      status: 'failed',
      progress: 72,
    })
  }
}

async function generateOverlayMap(
  taskId: string,
  processedActivities: Activity[],
  output: OverlayMapOutputConfig,
  tempDir: string
) {
  appendTaskLog(taskId, '正在生成轨迹叠加网页...', 'info')
  updateTaskOutputProgress(taskId, 'overlayMap', {
    status: 'running',
    progress: 72,
  })

  const scriptPath = path.join(process.cwd(), 'lib/python/generate_multiple_overlays.py')
  const filename = `overlay_${output.style}_${taskId}.html`
  const outputPath = path.join(tempDir, filename)
  const fitFilePaths = processedActivities.map((activity) => path.join(tempDir, `${activity.RideId}.fit`))
  const args = [...fitFilePaths, outputPath, output.style]

  try {
    const { stdout } = await executePythonScript(scriptPath, args, (message) => {
      appendTaskLog(taskId, message, 'info')
    })
    const pythonResult = parsePythonResult(stdout)

    if (!pythonResult.success) {
      appendTaskLog(taskId, `生成轨迹叠加网页失败: ${pythonResult.error}`, 'error')
      updateTaskOutputProgress(taskId, 'overlayMap', {
        status: 'failed',
        progress: 72,
      })
      return
    }

    addTaskArtifact(taskId, {
      kind: 'overlay-map',
      filename,
      url: buildArtifactUrl(taskId, filename),
      contentType: 'text/html',
      style: output.style,
    })

    appendTaskLog(
      taskId,
      `轨迹叠加网页已生成: ${filename} (${pythonResult.totalTracks ?? processedActivities.length} 个轨迹)`,
      'success'
    )
    updateTaskOutputProgress(taskId, 'overlayMap', {
      status: 'completed',
      progress: 100,
    })
    setTaskProgress(taskId, 95)
  } catch (error: unknown) {
    appendTaskLog(taskId, `生成轨迹叠加网页失败: ${getErrorMessage(error)}`, 'error')
    updateTaskOutputProgress(taskId, 'overlayMap', {
      status: 'failed',
      progress: 72,
    })
  }
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

function parsePythonResult(stdout: string): {
  success: boolean
  error?: string
  totalTracks?: number
  gridSize?: string
} {
  if (stdout.trim() === '') {
    return {
      success: false,
      error: 'Python 脚本未返回结果',
    }
  }

  try {
    const parsed = JSON.parse(stdout) as Record<string, unknown>
    const success = parsed.success === true
    const error = typeof parsed.error === 'string' ? parsed.error : undefined
    const totalTracks = typeof parsed.total_tracks === 'number' ? parsed.total_tracks : undefined
    const gridSize = typeof parsed.grid_size === 'string' ? parsed.grid_size : undefined

    return {
      success,
      error,
      totalTracks,
      gridSize,
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: `解析 Python 输出失败: ${getErrorMessage(error)}`,
    }
  }
}

function getRequestedArtifactCount(request: GenerationTaskRequest): number {
  return Number(request.outputs.combinedMap.enabled) + Number(request.outputs.overlayMap.enabled)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '未知错误'
}
