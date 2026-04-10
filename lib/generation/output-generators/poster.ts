import path from 'path'
import { promises as fs } from 'fs'
import { buildArtifactUrl, getFitFilePath } from '@/lib/generation/artifact-service'
import { executePythonScript } from '@/lib/generation/python-runner'
import { getErrorMessage } from '@/lib/error-utils'
import { parsePythonResult } from '@/lib/generation/python-result'
import {
  addTaskArtifact,
  appendTaskLog,
  setTaskProgress,
  updateTaskOutputProgress,
} from '@/lib/generation/task-store'
import type { Activity } from '@/lib/igpsport'

export async function generatePosterArtifact(
  taskId: string,
  processedActivities: Activity[],
  tempDir: string
) {
  appendTaskLog(taskId, '正在生成轨迹海报...', 'info')
  updateTaskOutputProgress(taskId, 'poster', {
    status: 'running',
    progress: 72,
  })

  const scriptPath = path.join(process.cwd(), 'lib/python/generate_track_art_poster.py')
  const fitListPath = path.join(tempDir, `poster_fit_list_${taskId}.txt`)
  const outputPath = path.join(tempDir, `track_art_poster_${taskId}.png`)
  const fitFilePaths = processedActivities.map((activity) => getFitFilePath(activity.RideId))

  await fs.writeFile(fitListPath, `${fitFilePaths.join('\n')}\n`, 'utf-8')

  try {
    const { stdout } = await executePythonScript(scriptPath, [fitListPath, outputPath], (message) => {
      appendTaskLog(taskId, message, 'info')
    })
    const pythonResult = parsePythonResult(stdout)

    if (!pythonResult.success) {
      appendTaskLog(taskId, `生成轨迹海报失败: ${pythonResult.error}`, 'error')
      updateTaskOutputProgress(taskId, 'poster', {
        status: 'failed',
        progress: 72,
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
      `轨迹海报已生成: ${filename} (${pythonResult.totalTracks ?? processedActivities.length} 个轨迹)`,
      'success'
    )
    updateTaskOutputProgress(taskId, 'poster', {
      status: 'completed',
      progress: 100,
    })
    setTaskProgress(taskId, 90)
  } catch (error: unknown) {
    appendTaskLog(taskId, `生成轨迹海报失败: ${getErrorMessage(error)}`, 'error')
    updateTaskOutputProgress(taskId, 'poster', {
      status: 'failed',
      progress: 72,
    })
  }
}
