import { existsSync, readdirSync, statSync, unlinkSync } from 'fs'
import path from 'path'
import { getArtifactDir, getFitDir, getFitFilePath } from '@/lib/generation/artifact-paths'

export const FILE_TTL_MS = 30 * 60 * 1000

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
