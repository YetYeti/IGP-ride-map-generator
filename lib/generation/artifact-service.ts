import { existsSync, readFileSync, statSync, unlinkSync } from 'fs'
import {
  cleanupExpiredFiles,
  cleanupFitFiles,
  FILE_TTL_MS,
} from '@/lib/generation/artifact-cleanup'
import {
  buildArtifactUrl,
  ensureTempDir,
  getArtifactDir,
  getArtifactPath,
  getFitDir,
  getFitFilePath,
  getTempDir,
} from '@/lib/generation/artifact-paths'

export {
  buildArtifactUrl,
  cleanupExpiredFiles,
  cleanupFitFiles,
  ensureTempDir,
  FILE_TTL_MS,
  getArtifactDir,
  getArtifactPath,
  getFitDir,
  getFitFilePath,
  getTempDir,
}

export function hasUsableFitFile(rideId: number): boolean {
  const filePath = getFitFilePath(rideId)

  if (!existsSync(filePath)) {
    return false
  }

  try {
    return statSync(filePath).size > 0
  } catch (error) {
    console.error(`检查 FIT 文件失败: ${rideId}.fit`, error)
    return false
  }
}

export function getArtifactInfo(filename: string): {
  exists: boolean
  expired: boolean
  filePath: string
} {
  const filePath = getArtifactPath(filename)

  if (!existsSync(filePath)) {
    return {
      exists: false,
      expired: false,
      filePath,
    }
  }

  const stats = statSync(filePath)
  const expired = Date.now() - stats.mtimeMs > FILE_TTL_MS

  return {
    exists: true,
    expired,
    filePath,
  }
}

export function deleteArtifactFile(filename: string) {
  const filePath = getArtifactPath(filename)

  if (existsSync(filePath)) {
    unlinkSync(filePath)
  }
}

export function readArtifactFile(filename: string): Buffer {
  return readFileSync(getArtifactPath(filename))
}
