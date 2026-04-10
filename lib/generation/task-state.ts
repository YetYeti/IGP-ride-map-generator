import {
  EMPTY_OUTPUT_PROGRESS,
  type GenerationLogEntry,
  type GenerationLogLevel,
  type GenerationOutputProgress,
  type GenerationTaskOutputsProgress,
} from '@/lib/generation/types'

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
