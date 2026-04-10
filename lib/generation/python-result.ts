export interface ParsedPythonResult {
  success: boolean
  error?: string
  totalTracks?: number
  gridSize?: string
}

export function parsePythonResult(stdout: string): ParsedPythonResult {
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

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '未知错误'
}
