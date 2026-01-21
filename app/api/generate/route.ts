import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { writeFileSync, existsSync, mkdirSync, unlinkSync, statSync, readdirSync } from 'fs'
import { spawn } from 'child_process'
import { IGPSPORTClient } from '@/lib/igpsport'
import path from 'path'

interface TaskFile {
  filename: string
  createdAt: number
}

interface Task {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  logs: { timestamp: string; message: string; level: string }[]
  result: any
  error: string | null
  files?: TaskFile[]
}

declare global {
  var tasks: Map<string, Task>
}

if (!global.tasks) {
  global.tasks = new Map()
}

function addLog(taskId: string, message: string, level = 'info') {
  const task = global.tasks.get(taskId)
  if (task) {
    const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    task.logs.push({ timestamp, message, level })
    global.tasks.set(taskId, task)
  }
}

function updateTask(
  taskId: string,
  updates: Partial<Task>
): Task | undefined {
  const task = global.tasks.get(taskId)
  if (task) {
    const updated = { ...task, ...updates }
    global.tasks.set(taskId, updated)
    return updated
  }
  return undefined
}

function executePythonCommand(
  scriptPath: string,
  args: string[],
  taskId: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const uvCmd = process.platform === 'win32' ? 'uv.exe' : 'uv'
    const fullArgs = ['run', '--no-sync', 'python', scriptPath, ...args]
    
    const child = spawn(uvCmd, fullArgs, {
      cwd: process.cwd(),
    })

    let stdout = ''
    let stderr = ''

    child.stderr?.on('data', (data) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.trim().startsWith('PROGRESS:')) {
          const progressMessage = line.replace('PROGRESS:', '').trim()
          addLog(taskId, progressMessage, 'info')
        }
      }
      stderr += data.toString()
    })

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`Python process exited with code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

interface CombinedMapSettings {
  trackWidth: number
  margin: number
  columns: number
}

function cleanupExpiredFiles(tempDir: string, maxAgeMs: number = 30 * 60 * 1000) {
  try {
    if (!existsSync(tempDir)) return

    const files = readdirSync(tempDir)
    const now = Date.now()
    let deletedCount = 0

    for (const file of files) {
      const filePath = path.join(tempDir, file)
      try {
        const stats = statSync(filePath)
        if (stats.isDirectory()) continue

        const age = now - stats.mtimeMs
        if (age > maxAgeMs) {
          unlinkSync(filePath)
          deletedCount++
          console.log(`Deleted expired file: ${file} (age: ${Math.floor(age / 60000)} min)`)
        }
      } catch (err) {
        console.error(`Failed to check file ${file}:`, err)
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired files`)
    }
  } catch (error) {
    console.error('Error cleaning up expired files:', error)
  }
}

function cleanupFitFiles(tempDir: string, processedActivities: any[]) {
  try {
    if (!existsSync(tempDir)) return

    let deletedCount = 0

    for (const activity of processedActivities) {
      const fitFilePath = path.join(tempDir, `${activity.RideId}.fit`)
      try {
        if (existsSync(fitFilePath)) {
          unlinkSync(fitFilePath)
          deletedCount++
          console.log(`Deleted FIT file: ${activity.RideId}.fit`)
        }
      } catch (err) {
        console.error(`Failed to delete FIT file ${activity.RideId}.fit:`, err)
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} FIT files`)
    }
  } catch (error) {
    console.error('Error cleaning up FIT files:', error)
  }
}

async function processTask(
  taskId: string,
  username: string,
  password: string,
  overlayMapStyle: string,
  generateCombinedMap: boolean,
  generateOverlayMaps: boolean,
  combinedMapSettings: CombinedMapSettings
) {
  try {
    console.log('=== Starting processTask for:', taskId, '===')
    addLog(taskId, '正在登录 IGPSPORT...', 'info')
    const client = new IGPSPORTClient()
    await client.login(username, password)
    addLog(taskId, '登录成功', 'success')

    updateTask(taskId, { progress: 10 })

    const activities = await client.getAllActivities((page, total) => {
      addLog(taskId, `正在获取第 ${page} 页活动...`, 'info')
      updateTask(taskId, { progress: 10 + (page * 5) })
    })

    const outdoorActivities = activities.filter((a) => a.Title !== '室内骑行')
    outdoorActivities.sort((a, b) => a.RideId - b.RideId)
    addLog(taskId, `找到 ${outdoorActivities.length} 个户外骑行`, 'info')

    updateTask(taskId, { progress: 30 })

    const tempDir = process.env.TEMP_DIR || path.join(process.cwd(), 'public', 'temp')
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }

    cleanupExpiredFiles(tempDir)

    const processedActivities: any[] = []

    const BATCH_SIZE = 5
    for (let batchStart = 0; batchStart < outdoorActivities.length; batchStart += BATCH_SIZE) {
      const batch = outdoorActivities.slice(batchStart, batchStart + BATCH_SIZE)
      const batchIndex = Math.floor(batchStart / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(outdoorActivities.length / BATCH_SIZE)

      addLog(taskId, `正在处理第 ${batchIndex}/${totalBatches} 批次（${batch.length} 个活动）...`, 'info')

      const batchResults = await Promise.all(
        batch.map(async (activity) => {
          try {
            const fitFile = await client.downloadFitFile(activity.RideId)
            const fitFilePath = `${tempDir}/${activity.RideId}.fit`

            writeFileSync(fitFilePath, fitFile)
            console.log('FIT file saved:', fitFilePath)

            return { success: true, activity }
          } catch (error: any) {
            console.error('Error processing activity:', error)
            addLog(taskId, `处理活动 ${activity.RideId} 失败: ${error.message}`, 'error')
            return { success: false, activity, error: error.message }
          }
        })
      )

      const successfulInBatch = batchResults.filter(r => r.success).map(r => r.activity)
      processedActivities.push(...successfulInBatch)

      const progress = 30 + (processedActivities.length / outdoorActivities.length) * 40
      updateTask(taskId, { progress })
    }

    addLog(taskId, `成功处理 ${processedActivities.length} 个活动`, 'success')

    updateTask(taskId, { progress: 70 })

    const result: any = {
      success: true,
      totalActivities: activities.length,
      outdoorActivities: outdoorActivities.length,
      processedActivities: processedActivities.length,
      combinedMaps: [],
      overlayMaps: [],
      files: [] as TaskFile[],
    }

    if (generateCombinedMap && processedActivities.length > 0) {
      addLog(taskId, '正在生成轨迹合成图...', 'info')

      const pythonScriptPath = path.join(process.cwd(), 'lib/python/generate_combined_map.py')
      const combinedMapFilename = `combined_map_${taskId}.png`
      const combinedMapPath = `${tempDir}/${combinedMapFilename}`

      const fitFilePaths = processedActivities.map(a => `${tempDir}/${a.RideId}.fit`)

      console.log('Executing Python script:', pythonScriptPath)
      console.log('Number of FIT files:', fitFilePaths.length)

      try {
        const args = [
          ...fitFilePaths,
          combinedMapPath,
          '--track-width',
          combinedMapSettings.trackWidth.toString(),
          '--margin',
          combinedMapSettings.margin.toString(),
          '--columns',
          combinedMapSettings.columns.toString(),
        ]

        const { stdout } = await executePythonCommand(pythonScriptPath, args, taskId)

        console.log('Python stdout length:', stdout.length)
        console.log('Python stdout preview:', stdout.substring(0, 500))

        if (stdout.length > 0) {
          const pythonResult = JSON.parse(stdout)
          if (pythonResult.success) {
            result.combinedMaps.push({
              filename: combinedMapFilename,
              url: `/api/download/${taskId}/${combinedMapFilename}`,
            })
            result.files.push({
              filename: combinedMapFilename,
              createdAt: Date.now(),
            })
            console.log('Combined map generated successfully')
            addLog(taskId, `轨迹合成图已生成: ${combinedMapFilename} (${pythonResult.total_tracks} 个轨迹，${pythonResult.grid_size})`, 'success')
          } else {
            addLog(taskId, `生成轨迹合成图失败: ${pythonResult.error}`, 'error')
          }
        }

        updateTask(taskId, { progress: 85 })
      } catch (error: any) {
        console.error('Python execution error:', error)
        addLog(taskId, `生成轨迹合成图失败: ${error.message}`, 'error')
      }
    }

    if (generateOverlayMaps) {
      addLog(taskId, '正在生成轨迹叠加网页...', 'info')

      const pythonScriptPath = path.join(process.cwd(), 'lib/python/generate_multiple_overlays.py')

      const fitFilePaths = processedActivities.map(a => `${tempDir}/${a.RideId}.fit`)

      const overlayFilename = `overlay_${overlayMapStyle}_${taskId}.html`
      const overlayPath = `${tempDir}/${overlayFilename}`

      console.log('Generating overlay map for style:', overlayMapStyle)
      console.log('Number of FIT files:', fitFilePaths.length)

      try {
        const args = [
          ...fitFilePaths,
          overlayPath,
          overlayMapStyle,
        ]

        const { stdout } = await executePythonCommand(pythonScriptPath, args, taskId)

        console.log('Python stdout length:', stdout.length)

        if (stdout.length > 0) {
          const pythonResult = JSON.parse(stdout)
          if (pythonResult.success) {
            result.overlayMaps.push({
              filename: overlayFilename,
              style: overlayMapStyle,
              url: `/api/download/${taskId}/${overlayFilename}`,
            })
            result.files.push({
              filename: overlayFilename,
              createdAt: Date.now(),
            })
            console.log(`Overlay map generated for ${overlayMapStyle}: ${overlayFilename}`)
            addLog(taskId, `轨迹叠加网页已生成: ${overlayFilename} (${pythonResult.total_tracks} 个轨迹)`, 'success')
          } else {
            addLog(taskId, `生成轨迹叠加网页失败: ${pythonResult.error}`, 'error')
          }
        }
      } catch (error: any) {
        console.error('Python execution error:', error)
        addLog(taskId, `生成轨迹叠加网页失败: ${error.message}`, 'error')
      }

      updateTask(taskId, { progress: 95 })

      cleanupFitFiles(tempDir, processedActivities)
    }

    addLog(taskId, '生成完成！', 'success')
    updateTask(taskId, { status: 'completed', progress: 100, result })
  } catch (error: any) {
    console.error('Process task catch:', error)
    addLog(taskId, `处理失败: ${error.message}`, 'error')
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== Generate API called ===')
    const body = await req.json()
    const {
      username,
      password,
      overlayMapStyle = 'default',
      generateCombinedMap,
      generateOverlayMaps,
      combinedMapSettings = {
        trackWidth: 4,
        margin: 300,
        columns: 6,
      }
    } = body

    console.log('Overlay map style:', overlayMapStyle)
    console.log('Generate combined map:', generateCombinedMap)
    console.log('Generate overlay maps:', generateOverlayMaps)
    console.log('Combined map settings:', combinedMapSettings)

    if (!username || !password) {
      return NextResponse.json(
        { error: 'IGPSPORT账号和密码必须填写' },
        { status: 400 }
      )
    }

    const taskId = uuidv4()
    console.log('Created task ID:', taskId)

    global.tasks.set(taskId, {
      id: taskId,
      status: 'processing',
      progress: 0,
      logs: [],
      result: null,
      error: null,
      files: [],
    })

    console.log('Task created:', taskId)

    addLog(taskId, '开始生成轨迹...', 'info')

    processTask(
      taskId,
      username,
      password,
      overlayMapStyle,
      generateCombinedMap,
      generateOverlayMaps,
      combinedMapSettings
    ).catch((error) => {
      console.error('Process task error:', error)
      addLog(taskId, `处理失败: ${error.message}`, 'error')
      updateTask(taskId, { status: 'failed', error: error.message })
    })

    return NextResponse.json({ taskId, status: 'processing' })
  } catch (error: any) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error.message },
      { status: 500 }
    )
  }
}
