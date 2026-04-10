import path from 'path'
import { buildArtifactUrl, getFitFilePath } from '@/lib/generation/artifact-service'
import { executePythonScript } from '@/lib/generation/python-runner'
import { getErrorMessage } from '@/lib/error-utils'
import { parsePythonResult } from '@/lib/generation/python-result'
import {
  addTaskArtifact,
  appendTaskLog,
  updateTaskOutputProgress,
} from '@/lib/generation/task-store'
import type { OverlayMapOutputConfig } from '@/lib/generation/types'
import type { Activity } from '@/lib/igpsport'

export async function generateOverlayMapArtifact(
  taskId: string,
  processedActivities: Activity[],
  output: OverlayMapOutputConfig,
  tempDir: string,
  gpsCachePath: string | null
) {
  appendTaskLog(taskId, '正在生成轨迹叠加网页...', 'info')
  updateTaskOutputProgress(taskId, 'overlayMap', {
    status: 'running',
    progress: 5,
  })

  const scriptPath = path.join(process.cwd(), 'lib/python/generate_multiple_overlays.py')
  const filename = `overlay_${output.style}_${taskId}.html`
  const outputPath = path.join(tempDir, filename)
  const fitFilePaths = processedActivities.map((activity) => getFitFilePath(activity.RideId))
  const args = [...fitFilePaths, outputPath, output.style]

  if (gpsCachePath) {
    args.push('--gps-cache', gpsCachePath)
  }

  try {
    const { stdout } = await executePythonScript(scriptPath, args, (message) => {
      appendTaskLog(taskId, message, 'info')
    })
    const pythonResult = parsePythonResult(stdout)

    if (!pythonResult.success) {
      appendTaskLog(taskId, `生成轨迹叠加网页失败: ${pythonResult.error}`, 'error')
      updateTaskOutputProgress(taskId, 'overlayMap', {
        status: 'failed',
        progress: 5,
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
  } catch (error: unknown) {
    appendTaskLog(taskId, `生成轨迹叠加网页失败: ${getErrorMessage(error)}`, 'error')
    updateTaskOutputProgress(taskId, 'overlayMap', {
      status: 'failed',
      progress: 5,
    })
  }
}
