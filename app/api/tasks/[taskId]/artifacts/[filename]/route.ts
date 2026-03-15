import { NextResponse } from 'next/server'
import {
  deleteArtifactFile,
  getArtifactInfo,
  readArtifactFile,
} from '@/lib/generation/artifact-service'
import { getTask } from '@/lib/generation/task-store'

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ taskId: string; filename: string }>
  }
) {
  try {
    const { taskId, filename } = await params

    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json(
        { error: '文件名无效' },
        { status: 400 }
      )
    }

    const task = getTask(taskId)
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      )
    }

    const artifact = task.artifacts.find((item) => item.filename === filename)
    if (!artifact) {
      return NextResponse.json(
        { error: '产物不存在' },
        { status: 404 }
      )
    }

    const artifactInfo = getArtifactInfo(filename)
    if (!artifactInfo.exists) {
      return NextResponse.json(
        { error: '文件不存在或已过期' },
        { status: 404 }
      )
    }

    if (artifactInfo.expired) {
      deleteArtifactFile(filename)
      return NextResponse.json(
        { error: '文件已过期（30分钟）' },
        { status: 404 }
      )
    }

    const fileBuffer = readArtifactFile(filename)
    const contentDisposition =
      artifact.contentType === 'text/html' || artifact.contentType === 'image/png'
        ? 'inline'
        : `attachment; filename="${artifact.filename}"`

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': artifact.contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    console.error('读取产物文件失败:', error)

    return NextResponse.json(
      { error: '读取文件失败' },
      { status: 500 }
    )
  }
}
