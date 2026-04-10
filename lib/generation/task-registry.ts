import type { GenerationTask } from '@/lib/generation/types'

declare global {
  var __generationTasks: Map<string, GenerationTask> | undefined
  var __taskCleanupTimer: ReturnType<typeof setInterval> | undefined
}

const TASK_TTL_MS = 30 * 60 * 1000
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

export function getGenerationTaskRegistry(): Map<string, GenerationTask> {
  const generationTasks = global.__generationTasks ?? new Map<string, GenerationTask>()

  if (!global.__generationTasks) {
    global.__generationTasks = generationTasks
  }

  return generationTasks
}

export function cloneTask(task: GenerationTask): GenerationTask {
  return structuredClone(task)
}

export function cleanupExpiredTasks(): void {
  const registry = getGenerationTaskRegistry()
  const now = Date.now()
  const expiredIds: string[] = []

  for (const [id, task] of registry) {
    if (
      (task.status === 'completed' || task.status === 'failed') &&
      now - new Date(task.updatedAt).getTime() > TASK_TTL_MS
    ) {
      expiredIds.push(id)
    }
  }

  for (const id of expiredIds) {
    registry.delete(id)
  }

  if (expiredIds.length > 0) {
    console.log(`清理了 ${expiredIds.length} 个过期任务`)
  }
}

export function startTaskCleanupInterval(): void {
  if (global.__taskCleanupTimer) {
    return
  }

  global.__taskCleanupTimer = setInterval(cleanupExpiredTasks, CLEANUP_INTERVAL_MS)
  if (global.__taskCleanupTimer.unref) {
    global.__taskCleanupTimer.unref()
  }
}
