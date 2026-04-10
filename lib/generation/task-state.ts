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
    poster: { ...EMPTY_OUTPUT_PROGRESS },
  }
}

export function createConfiguredOutputsProgress(outputs: {
  combinedMap: boolean
  overlayMap: boolean
  poster: boolean
}): GenerationTaskOutputsProgress {
  return {
    combinedMap: createOutputProgress(outputs.combinedMap),
    overlayMap: createOutputProgress(outputs.overlayMap),
    poster: createOutputProgress(outputs.poster),
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
): void {
  task.logs.push(createTaskLogEntry(message, level))
  task.updatedAt = createIsoTimestamp()
}

export function appendTaskArtifact(
  task: GenerationTask,
  artifact: Omit<GenerationArtifact, 'createdAt'> & { createdAt?: string }
): void {
  task.artifacts.push({
    ...artifact,
    createdAt: artifact.createdAt ?? createIsoTimestamp(),
  })
  task.updatedAt = createIsoTimestamp()
}

export function updateOutputProgressState(
  task: GenerationTask,
  output: 'combinedMap' | 'overlayMap' | 'poster',
  updates: {
    status?: GenerationOutputStatus
    progress?: number
  }
): void {
  const current = task.outputsProgress[output]
  if ('status' in updates && updates.status !== undefined) {
    current.status = updates.status
  }
  if ('progress' in updates && updates.progress !== undefined) {
    current.progress = clampProgress(updates.progress)
  }
  task.updatedAt = createIsoTimestamp()
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
