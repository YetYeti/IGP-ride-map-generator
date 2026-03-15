import { v4 as uuidv4 } from 'uuid'
import {
  EMPTY_OUTPUT_PROGRESS,
  EMPTY_GENERATION_TASK_STATS,
  type GenerationArtifact,
  type GenerationLogLevel,
  type GenerationOutputStatus,
  type GenerationTask,
  type GenerationTaskStats,
} from '@/lib/generation/types'

declare global {
  var __generationTasks: Map<string, GenerationTask> | undefined
}

const generationTasks = global.__generationTasks ?? new Map<string, GenerationTask>()

if (!global.__generationTasks) {
  global.__generationTasks = generationTasks
}

export function createTask(): GenerationTask {
  const timestamp = new Date().toISOString()
  const task: GenerationTask = {
    id: uuidv4(),
    status: 'queued',
    progress: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    logs: [],
    artifacts: [],
    stats: { ...EMPTY_GENERATION_TASK_STATS },
    outputsProgress: {
      combinedMap: { ...EMPTY_OUTPUT_PROGRESS },
      overlayMap: { ...EMPTY_OUTPUT_PROGRESS },
    },
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
  return mutateTask(taskId, (task) => ({
    ...task,
    status: 'running',
    error: null,
  }))
}

export function setTaskCompleted(taskId: string): GenerationTask | null {
  return mutateTask(taskId, (task) => ({
    ...task,
    status: 'completed',
    progress: 100,
    error: null,
  }))
}

export function setTaskFailed(taskId: string, error: string): GenerationTask | null {
  return mutateTask(taskId, (task) => ({
    ...task,
    status: 'failed',
    error,
  }))
}

export function setTaskProgress(taskId: string, progress: number): GenerationTask | null {
  return mutateTask(taskId, (task) => ({
    ...task,
    progress: Math.max(0, Math.min(100, Math.round(progress))),
  }))
}

export function appendTaskLog(
  taskId: string,
  message: string,
  level: GenerationLogLevel = 'info'
): GenerationTask | null {
  return mutateTask(taskId, (task) => ({
    ...task,
    logs: [
      ...task.logs,
      {
        timestamp: new Date().toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        message,
        level,
      },
    ],
  }))
}

export function updateTaskStats(
  taskId: string,
  stats: Partial<GenerationTaskStats>
): GenerationTask | null {
  return mutateTask(taskId, (task) => ({
    ...task,
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
  return mutateTask(taskId, (task) => ({
    ...task,
    artifacts: [
      ...task.artifacts,
      {
        ...artifact,
        createdAt: artifact.createdAt ?? new Date().toISOString(),
      },
    ],
  }))
}

export function configureTaskOutputs(
  taskId: string,
  outputs: {
    combinedMap: boolean
    overlayMap: boolean
  }
): GenerationTask | null {
  return mutateTask(taskId, (task) => ({
    ...task,
    outputsProgress: {
      combinedMap: outputs.combinedMap
        ? {
            enabled: true,
            status: 'pending',
            progress: 0,
          }
        : {
            ...EMPTY_OUTPUT_PROGRESS,
          },
      overlayMap: outputs.overlayMap
        ? {
            enabled: true,
            status: 'pending',
            progress: 0,
          }
        : {
            ...EMPTY_OUTPUT_PROGRESS,
          },
    },
  }))
}

export function updateTaskOutputProgress(
  taskId: string,
  output: 'combinedMap' | 'overlayMap',
  updates: {
    status?: GenerationOutputStatus
    progress?: number
  }
): GenerationTask | null {
  return mutateTask(taskId, (task) => ({
    ...task,
    outputsProgress: {
      ...task.outputsProgress,
      [output]: {
        ...task.outputsProgress[output],
        ...('status' in updates && updates.status !== undefined ? { status: updates.status } : {}),
        ...('progress' in updates && updates.progress !== undefined
          ? { progress: Math.max(0, Math.min(100, Math.round(updates.progress))) }
          : {}),
      },
    },
  }))
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
    updatedAt: new Date().toISOString(),
  }

  generationTasks.set(taskId, updatedTask)

  return cloneTask(updatedTask)
}

function cloneTask(task: GenerationTask): GenerationTask {
  return structuredClone(task)
}
