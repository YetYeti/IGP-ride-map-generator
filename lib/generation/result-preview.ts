import type {
  GenerationArtifact,
  GenerationArtifactKind,
  GenerationTask,
} from '@/lib/generation/types'

export function getArtifactsByKind(
  task: GenerationTask | null,
  kind: GenerationArtifactKind
): GenerationArtifact[] {
  return task?.artifacts.filter((artifact) => artifact.kind === kind) ?? []
}

export async function downloadArtifactFile(url: string, filename: string) {
  try {
    console.log('Downloading:', url, filename)

    const response = await fetch(url)
    if (!response.ok) {
      console.error('Download failed:', response.status)
      alert(`下载失败: ${response.status}`)
      return
    }

    const blob = await response.blob()
    console.log('Blob type:', blob.type, 'Size:', blob.size)

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    console.log('Download initiated')
  } catch (error: unknown) {
    console.error('Download error:', error)
    alert(`下载出错: ${getErrorMessage(error)}`)
  }
}

export function preloadImage(
  url: string,
  onLoadStateChange: (url: string, loaded: boolean) => void
) {
  const img = new Image()
  img.onload = () => {
    onLoadStateChange(url, true)
  }
  img.onerror = () => {
    console.error('Failed to load image:', url)
    onLoadStateChange(url, false)
  }
  img.src = url
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '未知错误'
}
