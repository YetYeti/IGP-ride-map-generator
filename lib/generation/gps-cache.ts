import path from 'path'
import { getFitFilePath } from '@/lib/generation/artifact-service'
import { executePythonScript } from '@/lib/generation/python-runner'
import { getErrorMessage } from '@/lib/error-utils'
import { parsePythonResult } from '@/lib/generation/python-result'
import { appendTaskLog } from '@/lib/generation/task-store'
import type { Activity } from '@/lib/igpsport'

export async function extractGpsCache(
  taskId: string,
  processedActivities: Activity[],
  tempDir: string
): Promise<string | null> {
  if (processedActivities.length === 0) {
    return null
  }

  appendTaskLog(taskId, '正在提取 GPS 数据缓存...', 'info')

  const scriptPath = path.join(process.cwd(), 'lib/python/extract_gps_cache.py')
  const cachePath = path.join(tempDir, `gps_cache_${taskId}.json`)
  const fitFilePaths = processedActivities.map((activity) => getFitFilePath(activity.RideId))
  const args = [...fitFilePaths, cachePath]

  try {
    const { stdout } = await executePythonScript(scriptPath, args, (message) => {
      appendTaskLog(taskId, message, 'info')
    })
    const result = parsePythonResult(stdout)

    if (!result.success) {
      appendTaskLog(taskId, `GPS 缓存提取失败: ${result.error}，将回退到逐文件解析`, 'warning')
      return null
    }

    appendTaskLog(
      taskId,
      `GPS 缓存已生成: ${result.totalTracks ?? processedActivities.length} 个轨迹`,
      'success'
    )
    return cachePath
  } catch (error: unknown) {
    appendTaskLog(
      taskId,
      `GPS 缓存提取失败: ${getErrorMessage(error)}，将回退到逐文件解析`,
      'warning'
    )
    return null
  }
}
