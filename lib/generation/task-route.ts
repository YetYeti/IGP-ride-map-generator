import { NextResponse } from 'next/server'
import { getTask } from '@/lib/generation/task-store'
import type { GenerationTask } from '@/lib/generation/types'

export function badTaskRequestResponse(error?: string) {
  return NextResponse.json(
    { error: error ?? '请求参数无效' },
    { status: 400 }
  )
}

export function acceptedTaskResponse(task: GenerationTask) {
  return NextResponse.json(
    { task },
    { status: 202 }
  )
}

export function taskNotFoundResponse() {
  return NextResponse.json(
    { error: '任务不存在' },
    { status: 404 }
  )
}

export function serverErrorResponse() {
  return NextResponse.json(
    { error: '服务器错误' },
    { status: 500 }
  )
}

export function getTaskOrNotFound(taskId: string): {
  task?: GenerationTask
  response?: NextResponse
} {
  const task = getTask(taskId)

  if (!task) {
    return {
      response: taskNotFoundResponse(),
    }
  }

  return { task }
}
