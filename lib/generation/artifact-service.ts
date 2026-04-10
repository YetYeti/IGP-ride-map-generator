import { existsSync, readFileSync, readdirSync, statSync, unlinkSync } from 'fs'
import path from 'path'
import {
  buildArtifactUrl,
  ensureTempDir,
  getArtifactDir,
  getArtifactPath,
  getFitDir,
  getFitFilePath,
  getTempDir,
} from '@/lib/generation/artifact-paths'

export const FILE_TTL_MS = 30 * 60 * 1000
export {
  buildArtifactUrl,
  ensureTempDir,
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

export function cleanupExpiredFiles(maxAgeMs: number = FILE_TTL_MS) {
  const artifactDir = getArtifactDir()

  try {
    if (!existsSync(artifactDir)) {
      return
    }

    const files = readdirSync(artifactDir)
    const now = Date.now()

    for (const file of files) {
      const filePath = path.join(artifactDir, file)

      try {
        const stats = statSync(filePath)
        if (stats.isDirectory()) {
          continue
        }

        if (path.extname(file).toLowerCase() === '.fit') {
          continue
        }

        if (now - stats.mtimeMs > maxAgeMs) {
          unlinkSync(filePath)
        }
      } catch (error) {
        console.error(`清理过期文件失败: ${file}`, error)
      }
    }
  } catch (error) {
    console.error('清理临时文件目录失败:', error)
  }
}

export function cleanupFitFiles(rideIds: number[]) {
  const fitDir = getFitDir()

  if (!existsSync(fitDir)) {
    return
  }

  for (const rideId of rideIds) {
    const filePath = getFitFilePath(rideId)

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    } catch (error) {
      console.error(`删除 FIT 文件失败: ${rideId}.fit`, error)
    }
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
