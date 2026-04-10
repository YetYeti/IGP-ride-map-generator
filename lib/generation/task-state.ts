import {
  EMPTY_OUTPUT_PROGRESS,
  type GenerationArtifact,
  type GenerationLogEntry,
  type GenerationLogLevel,
  type GenerationOutputProgress,
  type GenerationOutputStatus,
  type GenerationTask,
  type GenerationTaskOutputsProgress,
} from '@/lib/generation/types'

export function createIsoTimestamp(): string {
  return new Date().toISOString()
}

export function createEmptyOutputsProgress(): GenerationTaskOutputsProgress {
  return {
    combinedMap: { ...EMPTY_OUTPUT_PROGRESS },
    overlayMap: { ...EMPTY_OUTPUT_PROGRESS },
  }
}

export function createConfiguredOutputsProgress(outputs: {
  combinedMap: boolean
  overlayMap: boolean
}): GenerationTaskOutputsProgress {
  return {
    combinedMap: createOutputProgress(outputs.combinedMap),
    overlayMap: createOutputProgress(outputs.overlayMap),
  }
}

export function createTaskLogEntry(
  message: string,
  level: GenerationLogLevel = 'info'
): GenerationLogEntry {
  return {
    timestamp: new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    message,
    level,
  }
}

export function appendTaskLogEntry(
  task: GenerationTask,
  message: string,
  level: GenerationLogLevel = 'info'
): GenerationTask {
  return {
    ...task,
    logs: [
      ...task.logs,
      createTaskLogEntry(message, level),
    ],
  }
}

export function appendTaskArtifact(
  task: GenerationTask,
  artifact: Omit<GenerationArtifact, 'createdAt'> & { createdAt?: string }
): GenerationTask {
  return {
    ...task,
    artifacts: [
      ...task.artifacts,
      {
        ...artifact,
        createdAt: artifact.createdAt ?? createIsoTimestamp(),
      },
    ],
  }
}

export function updateOutputProgressState(
  task: GenerationTask,
  output: 'combinedMap' | 'overlayMap',
  updates: {
    status?: GenerationOutputStatus
    progress?: number
  }
): GenerationTask {
  return {
    ...task,
    outputsProgress: {
      ...task.outputsProgress,
      [output]: {
        ...task.outputsProgress[output],
        ...('status' in updates && updates.status !== undefined ? { status: updates.status } : {}),
        ...('progress' in updates && updates.progress !== undefined
          ? { progress: clampProgress(updates.progress) }
          : {}),
      },
    },
  }
}

export function clampProgress(progress: number): number {
  return Math.max(0, Math.min(100, Math.round(progress)))
}

function createOutputProgress(enabled: boolean): GenerationOutputProgress {
  if (!enabled) {
    return { ...EMPTY_OUTPUT_PROGRESS }
  }

  return {
    enabled: true,
    status: 'pending',
    progress: 0,
  }
}
