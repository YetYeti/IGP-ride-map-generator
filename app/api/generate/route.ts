import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { writeFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs'
import { spawn } from 'child_process'
import { IGPSPORTClient } from '@/lib/igpsport'
import { saveTask, updateTask, getTask } from '@/lib/file-task-manager'
import path from 'path'

interface Task {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  logs: { timestamp: string; message: string; level: string }[]
  result: any
  error: string | null
}

function addLog(taskId: string, message: string, level = 'info') {
  const task = getTask(taskId)
  if (task) {
    const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    task.logs.push({ timestamp, message, level })
    saveTask(taskId, task)
  }
}


function executePythonCommand(
  command: string,
  args: string[],
  taskId: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // 直接使用 python3（依赖已通过 uv sync 安装）
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
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

    const outputDir = process.env.OUTPUT_DIR || process.cwd() + '/public/output'
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    const processedActivities: any[] = []

    // 并发下载 FIT 文件（每批 5 个）
    const BATCH_SIZE = 5
    for (let batchStart = 0; batchStart < outdoorActivities.length; batchStart += BATCH_SIZE) {
      const batch = outdoorActivities.slice(batchStart, batchStart + BATCH_SIZE)
      const batchIndex = Math.floor(batchStart / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(outdoorActivities.length / BATCH_SIZE)

      addLog(taskId, `正在处理第 ${batchIndex}/${totalBatches} 批次（${batch.length} 个活动）...`, 'info')

      // 并发下载这一批
      const batchResults = await Promise.all(
        batch.map(async (activity) => {
          try {
            const fitFile = await client.downloadFitFile(activity.RideId)
            const fitFilePath = `${outputDir}/${activity.RideId}.fit`

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

      // 将成功的活动添加到结果中
      const successfulInBatch = batchResults.filter(r => r.success).map(r => r.activity)
      processedActivities.push(...successfulInBatch)

      // 更新进度
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
    }

    if (generateCombinedMap && processedActivities.length > 0) {
      addLog(taskId, '正在生成轨迹合成图...', 'info')

      const pythonScriptPath = process.cwd() + '/lib/python/generate_combined_map.py'
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
              url: `/api/download/${taskId}/${combinedMapFilename}`,
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

      const pythonScriptPath = process.cwd() + '/lib/python/generate_multiple_overlays.py'

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
              url: `/api/download/${taskId}/${overlayFilename}`,
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

    saveTask(taskId, {
      id: taskId,
      status: 'processing',
      progress: 0,
      logs: [],
      result: null,
      error: null,
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
