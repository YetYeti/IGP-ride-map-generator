import { NextRequest, NextResponse } from 'next/server'

interface TaskFile {
  filename: string
  createdAt: number
}

interface Task {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  result: any
  error: string | null
  files?: TaskFile[]
}

declare global {
  var tasks: Map<string, Task>
}

if (!global.tasks) {
  global.tasks = new Map()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params
    const taskId = resolvedParams.taskId
    const task = global.tasks.get(taskId)

    if (!task) {
      console.log('Task not found:', taskId)
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error: any) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
