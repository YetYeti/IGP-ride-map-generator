import path from 'path'
import { promises as fs } from 'fs'
import { buildArtifactUrl, getFitFilePath } from '@/lib/generation/artifact-service'
import { executePythonScript } from '@/lib/generation/python-runner'
import { getErrorMessage } from '@/lib/error-utils'
import { parsePythonResult } from '@/lib/generation/python-result'
import {
  addTaskArtifact,
  appendTaskLog,
  updateTaskOutputProgress,
} from '@/lib/generation/task-store'
import type { Activity } from '@/lib/igpsport'
import type { PosterOutputConfig } from '@/lib/generation/types'

const POSTER_BASE_SIZE = 9

function posterDimensionsForAspectRatio(aspectRatio: PosterOutputConfig['aspectRatio']): {
  width: number
  height: number
} {
  const [w, h] = aspectRatio.split(':').map(Number)
  if (w >= h) {
    return { width: POSTER_BASE_SIZE, height: POSTER_BASE_SIZE * (h / w) }
  }
  return { width: POSTER_BASE_SIZE * (w / h), height: POSTER_BASE_SIZE }
}

export async function generatePosterArtifact(
  taskId: string,
  processedActivities: Activity[],
  tempDir: string,
  gpsCachePath: string | null,
  config: PosterOutputConfig
) {
  appendTaskLog(taskId, '正在生成轨迹海报...', 'info')
  updateTaskOutputProgress(taskId, 'poster', {
    status: 'running',
    progress: 5,
  })

  const { width, height } = posterDimensionsForAspectRatio(config.aspectRatio)
  const scriptPath = path.join(process.cwd(), 'lib/python/generate_track_art_poster.py')
  const fitListPath = path.join(tempDir, `poster_fit_list_${taskId}.txt`)
  const outputPath = path.join(tempDir, `track_art_poster_${taskId}.png`)
  const posterActivities = getPosterActivities(processedActivities, config)

  if (posterActivities.length === 0) {
    appendTaskLog(taskId, '生成轨迹海报失败: 未找到所选活动', 'error')
    updateTaskOutputProgress(taskId, 'poster', {
      status: 'failed',
      progress: 5,
    })
    return
  }

  const fitFilePaths = posterActivities.map((activity) => getFitFilePath(activity.RideId))

  try {
    await fs.writeFile(fitListPath, `${fitFilePaths.join('\n')}\n`, 'utf-8')

    const args = [fitListPath, outputPath, '--width', width.toString(), '--height', height.toString()]

    if (gpsCachePath) {
      args.push('--gps-cache', gpsCachePath)
    }

    const { stdout } = await executePythonScript(scriptPath, args, (message) => {
      appendTaskLog(taskId, message, 'info')
    })
    const pythonResult = parsePythonResult(stdout)

    if (!pythonResult.success) {
      appendTaskLog(taskId, `生成轨迹海报失败: ${pythonResult.error}`, 'error')
      updateTaskOutputProgress(taskId, 'poster', {
        status: 'failed',
        progress: 5,
      })
      return
    }

    const resolvedOutputPath = pythonResult.outputPath ?? outputPath
    const filename = path.basename(resolvedOutputPath)

    addTaskArtifact(taskId, {
      kind: 'poster',
      filename,
      url: buildArtifactUrl(taskId, filename),
      contentType: 'image/png',
    })

    appendTaskLog(
      taskId,
      `轨迹海报已生成: ${filename} (${pythonResult.totalTracks ?? posterActivities.length} 个轨迹)`,
      'success'
    )
    updateTaskOutputProgress(taskId, 'poster', {
      status: 'completed',
      progress: 100,
    })
  } catch (error: unknown) {
    appendTaskLog(taskId, `生成轨迹海报失败: ${getErrorMessage(error)}`, 'error')
    updateTaskOutputProgress(taskId, 'poster', {
      status: 'failed',
      progress: 5,
    })
  }
}

function getPosterActivities(
  processedActivities: Activity[],
  config: PosterOutputConfig
): Activity[] {
  if (config.activityMode !== 'single' || config.selectedRideId === null) {
    return processedActivities
  }

  return processedActivities.filter((activity) => activity.RideId === config.selectedRideId)
}
