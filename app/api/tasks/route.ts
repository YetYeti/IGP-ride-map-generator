import { NextRequest, NextResponse } from 'next/server'
import { parseGenerationTaskRequest } from '@/lib/generation/request'
import {
  acceptedTaskResponse,
  badTaskRequestResponse,
  serverErrorResponse,
} from '@/lib/generation/task-route'
import { startTaskRun } from '@/lib/generation/task-runner'
import { createTask, getRunningTaskCount } from '@/lib/generation/task-store'

const MAX_CONCURRENT_TASKS = 3

export async function POST(req: NextRequest) {
  try {
    if (getRunningTaskCount() >= MAX_CONCURRENT_TASKS) {
      return NextResponse.json(
        { error: '当前任务过多，请稍后重试' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { request, error } = parseGenerationTaskRequest(body)

    if (!request) {
      return badTaskRequestResponse(error)
    }

    const task = createTask()
    startTaskRun(task.id, request)

    return acceptedTaskResponse(task)
  } catch (error: unknown) {
    console.error('创建任务失败:', error)

    return serverErrorResponse()
  }
}
