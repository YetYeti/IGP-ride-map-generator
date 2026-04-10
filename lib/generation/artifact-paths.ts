import { existsSync, mkdirSync } from 'fs'
import path from 'path'

export function getTempDir(): string {
  return getArtifactDir()
}

export function getArtifactDir(): string {
  return process.env.TEMP_DIR || path.join(process.cwd(), 'public', 'outputs')
}

export function getFitDir(): string {
  return process.env.TEMP_DIR || path.join(process.cwd(), 'public', 'fit_files')
}

export function ensureTempDir(): string {
  const artifactDir = getArtifactDir()
  const fitDir = getFitDir()

  ensureDirectory(artifactDir)

  if (fitDir !== artifactDir) {
    ensureDirectory(fitDir)
  }

  return artifactDir
}

export function buildArtifactUrl(taskId: string, filename: string): string {
  return `/api/tasks/${taskId}/artifacts/${filename}`
}

export function getArtifactPath(filename: string): string {
  return path.join(getArtifactDir(), filename)
}

export function getFitFilePath(rideId: number): string {
  return path.join(getFitDir(), `${rideId}.fit`)
}

function ensureDirectory(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}
