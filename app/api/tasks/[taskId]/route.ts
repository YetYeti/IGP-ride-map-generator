import { NextResponse } from 'next/server'
import { getTaskOrNotFound, serverErrorResponse } from '@/lib/generation/task-route'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const { task, response } = getTaskOrNotFound(taskId)

    if (response) {
      return response
    }

    return NextResponse.json(task)
  } catch (error: unknown) {
    console.error('获取任务失败:', error)

    return serverErrorResponse()
  }
}
