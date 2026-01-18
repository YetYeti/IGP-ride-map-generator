import { spawn } from 'child_process'

export async function getPythonCommand(): Promise<string> {
  // 调用 Python 脚本获取 sys.executable
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['-c', 'import sys; import json; print(json.dumps({"path": sys.executable}))'])
    let output = ''
    let errorOutput = ''

    python.stdout.on('data', (data) => {
      output += data.toString()
    })

    python.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output)
          if (result.path) {
            console.log(`Python detected at: ${result.path}`)
            resolve(result.path)
          } else if (result.error) {
            reject(new Error(result.error))
          } else {
            reject(new Error('Unexpected response from Python'))
          }
        } catch (e) {
          reject(new Error(`Failed to parse Python response: ${e}`))
        }
      } else {
        reject(new Error(`Python exited with code ${code}${errorOutput ? ': ' + errorOutput : ''}`))
      }
    })

    python.on('error', (error) => {
      reject(new Error(`Failed to spawn Python: ${error}`))
    })
  })
}
