import { NextRequest, NextResponse } from 'next/server'
import { parseGenerationTaskRequest } from '@/lib/generation/request'
import {
  acceptedTaskResponse,
  badTaskRequestResponse,
  serverErrorResponse,
} from '@/lib/generation/task-route'
import { startTaskRun } from '@/lib/generation/task-runner'
import { createTask, getRunningTaskCount } from '@/lib/generation/task-store'
import {
  getAccountSessionActivitySnapshot,
  getAccountSessionCredentials,
} from '@/lib/session/session-store'

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

    const credentials = getAccountSessionCredentials()
    if (!credentials) {
      return NextResponse.json(
        { error: '请先登录账号并完成活动获取' },
        { status: 401 }
      )
    }

    const sessionActivitySnapshot = getAccountSessionActivitySnapshot()
    if (!sessionActivitySnapshot) {
      return NextResponse.json(
        { error: '当前账号活动数据不可用，请重新登录' },
        { status: 409 }
      )
    }

    const task = createTask()
    startTaskRun(task.id, request, credentials, sessionActivitySnapshot)

    return acceptedTaskResponse(task)
  } catch (error: unknown) {
    console.error('创建任务失败:', error)

    return serverErrorResponse()
  }
}
