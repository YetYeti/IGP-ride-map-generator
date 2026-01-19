import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync, statSync, unlinkSync } from 'fs'
import path from 'path'

const FILE_TTL_MS = 30 * 60 * 1000 // 30 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string; filename: string }> }
) {
  try {
    const resolvedParams = await params
    const { taskId, filename } = resolvedParams

    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const tempDir = process.env.TEMP_DIR || path.join(process.cwd(), 'public', 'temp')
    const filePath = path.join(tempDir, filename)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      )
    }

    const stats = statSync(filePath)
    const now = Date.now()
    const age = now - stats.mtimeMs

    if (age > FILE_TTL_MS) {
      console.log(`Deleting expired file: ${filename} (age: ${Math.floor(age / 60000)} min)`)
      unlinkSync(filePath)
      return NextResponse.json(
        { error: 'File expired (30 minutes)' },
        { status: 404 }
      )
    }

    const fileBuffer = readFileSync(filePath)

    const ext = filename.split('.').pop()?.toLowerCase()
    const contentType =
      ext === 'html'
        ? 'text/html'
        : ext === 'png'
          ? 'image/png'
          : 'application/octet-stream'

    const contentDisposition =
      ext === 'html'
        ? 'inline'
        : `attachment; filename="${filename}"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store',
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
