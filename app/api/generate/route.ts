import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { writeFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs'
import { spawn } from 'child_process'
import { IGPSPORTClient } from '@/lib/igpsport'
import path from 'path'

interface Task {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  logs: { timestamp: string; message: string; level: string }[]
  result: any
  error: string | null
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
    const timestamp = new Date().toLocaleTimeString('zh-CN')
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


function getPythonCommand(): string {
  const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python')
  
  if (process.env.VERCEL) {
    // Vercel 环境：使用系统 python3
    return 'python3'
  }
  
  // 本地开发环境
  if (existsSync(venvPython)) {
    // 有 .venv：使用 .venv 中的 python（绝对路径）
    return venvPython
  }
  
  // 无 .venv：使用系统 python3
  return process.platform === 'win32' ? 'python' : 'python3'
}
function executePythonCommand(
  command: string,
  args: string[],
  taskId: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const pythonCmd = getPythonCommand()
    const child = spawn(pythonCmd, args, {
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

    addLog(taskId, '正在获取活动列表...', 'info')
    const activities = await client.getAllActivities((page, total) => {
      addLog(taskId, `正在获取第 ${page} 页活动...`, 'info')
      updateTask(taskId, { progress: 10 + (page * 5) })
    })
    addLog(taskId, `总共获取到 ${activities.length} 个活动`, 'info')

    const outdoorActivities = activities.filter((a) => a.Title !== '室内骑行')
    addLog(taskId, `找到 ${outdoorActivities.length} 个户外骑行`, 'info')

    updateTask(taskId, { progress: 30 })

    const outputDir = process.cwd() + '/public/output'
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    const processedActivities: any[] = []
    const allGpsData: [number, number][][] = []

    for (let i = 0; i < outdoorActivities.length; i++) {
      const activity = outdoorActivities[i]
      addLog(
        taskId,
        `正在处理活动 ${i + 1}/${outdoorActivities.length}: ${activity.RideId}`,
        'info'
      )

      try {
        const fitFile = await client.downloadFitFile(activity.RideId)
        const fitFilePath = `${outputDir}/${activity.RideId}.fit`
        
        writeFileSync(fitFilePath, fitFile)
        console.log('FIT file saved:', fitFilePath)

        const gpsData = generateMockGPSData()
        allGpsData.push(
          gpsData.map((p) => [p.lat, p.long])
        )
        processedActivities.push(activity)

        updateTask(taskId, {
          progress: 30 + ((i + 1) / outdoorActivities.length) * 40,
        })
      } catch (error: any) {
        console.error('Error processing activity:', error)
        addLog(taskId, `处理活动 ${activity.RideId} 失败: ${error.message}`, 'error')
      }
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
    }

    if (generateCombinedMap && processedActivities.length > 0) {
      addLog(taskId, '正在生成轨迹合成图...', 'info')

      const pythonScriptPath = process.cwd() + '/api/python/generate_combined_map.py'
      const combinedMapFilename = `combined_map_${taskId}.png`
      const combinedMapPath = `${outputDir}/${combinedMapFilename}`

      const fitFilePaths = processedActivities.map(a => `${outputDir}/${a.RideId}.fit`)

      console.log('Executing Python script:', pythonScriptPath)
      console.log('Number of FIT files:', fitFilePaths.length)

      try {
        const args = [
          pythonScriptPath,
          ...fitFilePaths,
          combinedMapPath,
          '--track-width',
          combinedMapSettings.trackWidth.toString(),
          '--margin',
          combinedMapSettings.margin.toString(),
          '--columns',
          combinedMapSettings.columns.toString(),
        ]

        const { stdout } = await executePythonCommand('python3', args, taskId)

        console.log('Python stdout length:', stdout.length)
        console.log('Python stdout preview:', stdout.substring(0, 500))

        if (stdout.length > 0) {
          const pythonResult = JSON.parse(stdout)
          if (pythonResult.success) {
            result.combinedMaps.push({
              filename: combinedMapFilename,
              url: `/output/${combinedMapFilename}`,
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

    if (generateOverlayMaps && allGpsData.length > 0) {
      addLog(taskId, '正在生成轨迹叠加网页...', 'info')

      const pythonScriptPath = process.cwd() + '/api/python/generate_multiple_overlays.py'

      const fitFilePaths = processedActivities.map(a => `${outputDir}/${a.RideId}.fit`)

      const overlayFilename = `overlay_${overlayMapStyle}_${taskId}.html`
      const overlayPath = `${outputDir}/${overlayFilename}`

      console.log('Generating overlay map for style:', overlayMapStyle)
      console.log('Number of FIT files:', fitFilePaths.length)

      try {
        const args = [
          pythonScriptPath,
          ...fitFilePaths,
          overlayPath,
          overlayMapStyle,
        ]

        const { stdout } = await executePythonCommand('python3', args, taskId)

        console.log('Python stdout length:', stdout.length)

        if (stdout.length > 0) {
          const pythonResult = JSON.parse(stdout)
          if (pythonResult.success) {
            result.overlayMaps.push({
              filename: overlayFilename,
              style: overlayMapStyle,
              url: `/output/${overlayFilename}`,
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
    }

    addLog(taskId, '生成完成！', 'success')
    updateTask(taskId, { status: 'completed', progress: 100, result })
  } catch (error: any) {
    console.error('Process task catch:', error)
    addLog(taskId, `处理失败: ${error.message}`, 'error')
    throw error
  }
}

function generateMockGPSData(): { lat: number; long: number }[] {
  const gpsData: { lat: number; long: number }[] = []
  const baseLat = 31.2304
  const baseLong = 121.4737

  for (let i = 0; i < 100; i++) {
    const lat = baseLat + Math.sin(i * 0.1) * 0.01
    const long = baseLong + Math.cos(i * 0.1) * 0.01
    gpsData.push({ lat, long })
  }

  return gpsData
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

    console.log('Username:', username)
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
    })

    console.log('Available tasks:', Array.from(global.tasks.keys()))

    addLog(taskId, '开始生成轨迹...', 'info')
    addLog(taskId, `账号: ${username}`, 'info')

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
