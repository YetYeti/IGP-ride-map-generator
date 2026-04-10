import type { GenerationTask } from '@/lib/generation/types'

declare global {
  var __generationTasks: Map<string, GenerationTask> | undefined
}

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
