import { NextResponse } from 'next/server'
import type { GenerationArtifact } from '@/lib/generation/types'

export function invalidArtifactFilenameResponse() {
  return NextResponse.json(
    { error: '文件名无效' },
    { status: 400 }
  )
}

export function artifactNotFoundResponse() {
  return NextResponse.json(
    { error: '产物不存在' },
    { status: 404 }
  )
}

export function missingArtifactFileResponse() {
  return NextResponse.json(
    { error: '文件不存在或已过期' },
    { status: 404 }
  )
}

export function expiredArtifactResponse() {
  return NextResponse.json(
    { error: '文件已过期（30分钟）' },
    { status: 404 }
  )
}

export function artifactReadErrorResponse() {
  return NextResponse.json(
    { error: '读取文件失败' },
    { status: 500 }
  )
}

export function artifactFileResponse(fileBuffer: Buffer, artifact: GenerationArtifact) {
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
}
