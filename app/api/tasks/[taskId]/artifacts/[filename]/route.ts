import {
  deleteArtifactFile,
  getArtifactInfo,
  readArtifactFile,
} from '@/lib/generation/artifact-service'
import {
  artifactFileResponse,
  artifactNotFoundResponse,
  artifactReadErrorResponse,
  expiredArtifactResponse,
  invalidArtifactFilenameResponse,
  missingArtifactFileResponse,
} from '@/lib/generation/artifact-route'
import { getTaskOrNotFound } from '@/lib/generation/task-route'

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
      return invalidArtifactFilenameResponse()
    }

    const { task, response } = getTaskOrNotFound(taskId)
    if (response) {
      return response
    }
    if (!task) {
      return artifactReadErrorResponse()
    }

    const artifact = task.artifacts.find((item) => item.filename === filename)
    if (!artifact) {
      return artifactNotFoundResponse()
    }

    const artifactInfo = getArtifactInfo(filename)
    if (!artifactInfo.exists) {
      return missingArtifactFileResponse()
    }

    if (artifactInfo.expired) {
      deleteArtifactFile(filename)
      return expiredArtifactResponse()
    }

    const fileBuffer = readArtifactFile(filename)
    return artifactFileResponse(fileBuffer, artifact)
  } catch (error: unknown) {
    console.error('读取产物文件失败:', error)

    return artifactReadErrorResponse()
  }
}
