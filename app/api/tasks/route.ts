import { NextRequest, NextResponse } from 'next/server'
import { parseGenerationTaskRequest } from '@/lib/generation/request'
import { startTaskRun } from '@/lib/generation/task-runner'
import { createTask } from '@/lib/generation/task-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { request, error } = parseGenerationTaskRequest(body)

    if (!request) {
      return NextResponse.json(
        { error: error ?? '请求参数无效' },
        { status: 400 }
      )
    }

    const task = createTask()
    startTaskRun(task.id, request)

    return NextResponse.json(
      { task },
      { status: 202 }
    )
  } catch (error: unknown) {
    console.error('创建任务失败:', error)

    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
