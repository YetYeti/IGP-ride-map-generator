import type { GenerationLogEntry, GenerationTask } from '@/lib/generation/types'

export const EMPTY_TASK_MESSAGE = '填写左侧参数后即可开始生成。'

export function getVisibleTaskLogs(
  task: GenerationTask | null,
  error: string | null
): GenerationLogEntry[] {
  if (task) {
    return task.logs
  }

  if (!error) {
    return []
  }

  return [
    {
      timestamp: new Date().toLocaleTimeString('zh-CN'),
      message: error,
      level: 'error',
    },
  ]
}

export function getTaskStatusLabel(task: GenerationTask | null, loading: boolean): string {
  if (task?.status === 'completed') {
    return '已完成'
  }

  if (task?.status === 'failed') {
    return '失败'
  }

  if (loading) {
    return '生成中'
  }

  return '待开始'
}

export function getLatestTaskMessage(
  task: GenerationTask | null,
  logs: GenerationLogEntry[]
): string {
  return task?.error ?? logs.at(-1)?.message ?? EMPTY_TASK_MESSAGE
}
