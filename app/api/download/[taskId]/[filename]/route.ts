import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string; filename: string }> }
) {
  const resolvedParams = await params
  const { taskId, filename } = resolvedParams

  // 安全检查：防止路径遍历攻击
  if (filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  // 从 /tmp/output 读取文件
  const filePath = `/tmp/output/${filename}`

  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: 'File not found or expired' },
      { status: 404 }
    )
  }

  try {
    const fileBuffer = readFileSync(filePath)

    // 根据文件扩展名设置 Content-Type
    const ext = filename.split('.').pop()?.toLowerCase()
    const contentType =
      ext === 'html'
        ? 'text/html'
        : ext === 'png'
          ? 'image/png'
          : 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store', // 不要缓存，因为 /tmp 目录会清理
      },
    })
  } catch (error: any) {
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}
