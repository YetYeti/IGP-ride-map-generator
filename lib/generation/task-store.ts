import { v4 as uuidv4 } from 'uuid'
import {
  cloneTask,
  getGenerationTaskRegistry,
  startTaskCleanupInterval,
} from '@/lib/generation/task-registry'
import {
  appendTaskArtifact,
  appendTaskLogEntry,
  clampProgress,
  createIsoTimestamp,
  createConfiguredOutputsProgress,
  createEmptyOutputsProgress,
  updateOutputProgressState,
} from '@/lib/generation/task-state'
import {
  EMPTY_GENERATION_TASK_STATS,
  type GenerationArtifact,
  type GenerationLogLevel,
  type GenerationOutputStatus,
  type GenerationTask,
  type GenerationTaskStats,
} from '@/lib/generation/types'

const generationTasks = getGenerationTaskRegistry()
startTaskCleanupInterval()

export function createTask(): GenerationTask {
  const timestamp = createIsoTimestamp()
  const task: GenerationTask = {
    id: uuidv4(),
    status: 'queued',
    progress: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    logs: [],
    artifacts: [],
    stats: { ...EMPTY_GENERATION_TASK_STATS },
    outputsProgress: createEmptyOutputsProgress(),
    error: null,
  }

  generationTasks.set(task.id, task)

  return cloneTask(task)
}

export function getTask(taskId: string): GenerationTask | null {
  const task = generationTasks.get(taskId)
  return task ? cloneTask(task) : null
}

export function setTaskRunning(taskId: string): GenerationTask | null {
  return patchTask(taskId, {
    status: 'running',
    error: null,
  })
}

export function setTaskCompleted(taskId: string): GenerationTask | null {
  return patchTask(taskId, {
    status: 'completed',
    progress: 100,
    error: null,
  })
}

export function setTaskFailed(taskId: string, error: string): GenerationTask | null {
  return patchTask(taskId, {
    status: 'failed',
    error,
  })
}

export function setTaskProgress(taskId: string, progress: number): GenerationTask | null {
  return patchTask(taskId, {
    progress: clampProgress(progress),
  })
}

export function appendTaskLog(
  taskId: string,
  message: string,
  level: GenerationLogLevel = 'info'
): GenerationTask | null {
  return mutateTask(taskId, (task) => appendTaskLogEntry(task, message, level))
}

export function updateTaskStats(
  taskId: string,
  stats: Partial<GenerationTaskStats>
): GenerationTask | null {
  return patchTask(taskId, (task) => ({
    stats: {
      ...task.stats,
      ...stats,
    },
  }))
}

export function addTaskArtifact(
  taskId: string,
  artifact: Omit<GenerationArtifact, 'createdAt'> & { createdAt?: string }
): GenerationTask | null {
  return mutateTask(taskId, (task) => appendTaskArtifact(task, artifact))
}

export function configureTaskOutputs(
  taskId: string,
  outputs: {
    combinedMap: boolean
    overlayMap: boolean
    poster: boolean
  }
): GenerationTask | null {
  return patchTask(taskId, {
    outputsProgress: createConfiguredOutputsProgress(outputs),
  })
}

export function updateTaskOutputProgress(
  taskId: string,
  output: 'combinedMap' | 'overlayMap' | 'poster',
  updates: {
    status?: GenerationOutputStatus
    progress?: number
  }
): GenerationTask | null {
  return mutateTask(taskId, (task) => updateOutputProgressState(task, output, updates))
}

function mutateTask(
  taskId: string,
  updater: (task: GenerationTask) => GenerationTask
): GenerationTask | null {
  const task = generationTasks.get(taskId)
  if (!task) {
    return null
  }

  const updatedTask = {
    ...updater(task),
    updatedAt: createIsoTimestamp(),
  }

  generationTasks.set(taskId, updatedTask)

  return cloneTask(updatedTask)
}

function patchTask(
  taskId: string,
  updates: Partial<GenerationTask> | ((task: GenerationTask) => Partial<GenerationTask>)
): GenerationTask | null {
  return mutateTask(taskId, (task) => ({
    ...task,
    ...(typeof updates === 'function' ? updates(task) : updates),
  }))
}
