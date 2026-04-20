import type {
  CreateGenerationTaskResponse,
  GenerationTask,
  GenerationTaskRequest,
  PosterActivityOption,
  PosterActivityOptionsResponse,
} from '@/lib/generation/types'

export async function createGenerationTask(request: GenerationTaskRequest): Promise<GenerationTask> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = (await response.json()) as CreateGenerationTaskResponse & { error?: string }

  if (!response.ok || !data.task) {
    throw new Error(data.error ?? '创建任务失败')
  }

  return data.task
}

export async function fetchGenerationTask(taskId: string): Promise<GenerationTask | null> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    return null
  }

  const nextTask = (await response.json()) as GenerationTask | { error?: string }

  if (!response.ok || !('id' in nextTask)) {
    throw new Error(
      'error' in nextTask && typeof nextTask.error === 'string'
        ? nextTask.error
        : '获取任务状态失败'
    )
  }

  return nextTask
}

export async function fetchPosterActivityOptions(
  request: Pick<GenerationTaskRequest, 'credentials' | 'filters'>
): Promise<PosterActivityOption[]> {
  const response = await fetch('/api/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = (await response.json()) as PosterActivityOptionsResponse & { error?: string }

  if (!response.ok || !Array.isArray(data.activities)) {
    throw new Error(data.error ?? '获取活动列表失败')
  }

  return data.activities
}
