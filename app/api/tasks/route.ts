import { NextRequest } from 'next/server'
import { parseGenerationTaskRequest } from '@/lib/generation/request'
import {
  acceptedTaskResponse,
  badTaskRequestResponse,
  serverErrorResponse,
} from '@/lib/generation/task-route'
import { startTaskRun } from '@/lib/generation/task-runner'
import { createTask } from '@/lib/generation/task-store'

export async function POST(req: NextRequest) {
  try {
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
