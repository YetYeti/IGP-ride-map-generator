import path from 'path'
import { getFitFilePath, buildArtifactUrl } from '@/lib/generation/artifact-service'
import { executePythonScript } from '@/lib/generation/python-runner'
import { getErrorMessage } from '@/lib/error-utils'
import { parsePythonResult } from '@/lib/generation/python-result'
import {
  addTaskArtifact,
  appendTaskLog,
  updateTaskOutputProgress,
} from '@/lib/generation/task-store'
import type { CombinedMapOutputConfig } from '@/lib/generation/types'
import type { Activity } from '@/lib/igpsport'

export async function generateCombinedMapArtifact(
  taskId: string,
  processedActivities: Activity[],
  output: CombinedMapOutputConfig,
  tempDir: string,
  gpsCachePath: string | null
) {
  appendTaskLog(taskId, '正在生成轨迹合成图...', 'info')
  updateTaskOutputProgress(taskId, 'combinedMap', {
    status: 'running',
    progress: 5,
  })

  const scriptPath = path.join(process.cwd(), 'lib/python/generate_combined_map.py')
  const filename = `combined_map_${taskId}.png`
  const outputPath = path.join(tempDir, filename)
  const fitFilePaths = processedActivities.map((activity) => getFitFilePath(activity.RideId))
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

  if (gpsCachePath) {
    args.push('--gps-cache', gpsCachePath)
  }

  try {
    const { stdout } = await executePythonScript(scriptPath, args, (message) => {
      appendTaskLog(taskId, message, 'info')
    })
    const pythonResult = parsePythonResult(stdout)

    if (!pythonResult.success) {
      appendTaskLog(taskId, `生成轨迹合成图失败: ${pythonResult.error}`, 'error')
      updateTaskOutputProgress(taskId, 'combinedMap', {
        status: 'failed',
        progress: 5,
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
  } catch (error: unknown) {
    appendTaskLog(taskId, `生成轨迹合成图失败: ${getErrorMessage(error)}`, 'error')
    updateTaskOutputProgress(taskId, 'combinedMap', {
      status: 'failed',
      progress: 5,
    })
  }
}
