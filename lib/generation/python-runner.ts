import { spawn } from 'child_process'

export interface PythonCommandResult {
  stdout: string
  stderr: string
}

export function executePythonScript(
  scriptPath: string,
  args: string[],
  onProgress?: (message: string) => void
): Promise<PythonCommandResult> {
  return new Promise((resolve, reject) => {
    const uvCommand = process.platform === 'win32' ? 'uv.exe' : 'uv'
    const child = spawn(uvCommand, ['run', '--no-sync', 'python', scriptPath, ...args], {
      cwd: process.cwd(),
    })

    let stdout = ''
    let stderr = ''
    let stderrRemainder = ''

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString()
      stderr += text
      stderrRemainder = consumeProgressLines(`${stderrRemainder}${text}`, onProgress)
    })

    child.on('close', (code) => {
      flushProgressLine(stderrRemainder, onProgress)

      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }

      reject(new Error(`Python process exited with code ${code}`))
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

function consumeProgressLines(
  buffer: string,
  onProgress?: (message: string) => void
): string {
  const lines = buffer.split('\n')
  const remainder = lines.pop() ?? ''

  for (const line of lines) {
    flushProgressLine(line, onProgress)
  }

  return remainder
}

function flushProgressLine(line: string, onProgress?: (message: string) => void) {
  const trimmedLine = line.trim()

  if (trimmedLine.startsWith('PROGRESS:')) {
    onProgress?.(trimmedLine.replace('PROGRESS:', '').trim())
  }
}
