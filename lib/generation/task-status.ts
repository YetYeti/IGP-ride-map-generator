import type { GenerationTask, GenerationTaskStatus } from '@/lib/generation/types'

export const TASK_EXPIRED_ERROR = '任务不存在或已过期'

export function isTaskActive(status?: GenerationTaskStatus | null): boolean {
  return status === 'queued' || status === 'running'
}

export function isTaskTerminal(status?: GenerationTaskStatus | null): boolean {
  return status === 'completed' || status === 'failed'
}

export function markTaskAsExpired(task: GenerationTask | null): GenerationTask | null {
  if (!task) {
    return null
  }

  return {
    ...task,
    status: 'failed',
    error: TASK_EXPIRED_ERROR,
  }
}
