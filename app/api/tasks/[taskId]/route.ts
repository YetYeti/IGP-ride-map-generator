import { NextResponse } from 'next/server'
import { getTask } from '@/lib/generation/task-store'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const task = getTask(taskId)

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error: unknown) {
    console.error('获取任务失败:', error)

    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
