'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { RideForm } from '@/components/RideForm'
import { LogDisplay, LogEntry } from '@/components/LogDisplay'
import { ResultPreview, GenerationResult } from '@/components/ResultPreview'
import { MapStyle } from '@/lib/map-styles'

interface CombinedMapSettings {
  trackWidth: number
  trackSpacing: number
  columns: number
  trackPadding: number
}

interface RideFormData {
  username: string
  password: string
  overlayMapStyle: MapStyle
  generateCombinedMap: boolean
  generateOverlayMaps: boolean
  combinedMapSettings: CombinedMapSettings
}

export default function Home() {
  const [loading, setLoading] = React.useState(false)
  const [taskId, setTaskId] = React.useState<string | null>(null)
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [result, setResult] = React.useState<GenerationResult | null>(null)

  const handleSubmit = async (data: RideFormData) => {
    try {
      console.log('=== Submitting form ===')
      console.log('Overlay map style:', data.overlayMapStyle)
      console.log('Generate combined map:', data.generateCombinedMap)
      console.log('Generate overlay maps:', data.generateOverlayMaps)
      console.log('Combined map settings:', data.combinedMapSettings)

      setLoading(true)
      setLogs([])
      setResult(null)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || '生成失败')
      }

      setTaskId(responseData.taskId)
      pollTaskStatus(responseData.taskId)
    } catch (error: any) {
      console.error('Submit error:', error)
      const timestamp = new Date().toLocaleTimeString('zh-CN')
      setLogs([{ timestamp, message: error.message, level: 'error' }])
    } finally {
      setLoading(false)
    }
  }

  const pollTaskStatus = async (id: string) => {
    console.log('=== Starting to poll task status ===')
    console.log('Task ID:', id)
    
    try {
      const response = await fetch(`/api/status/${id}`)
      // 检查是否 404（任务不存在或已过期）
      if (response.status === 404) {
        console.log('=== Task not found or expired ===')
        setLoading(false)
        return
      }

      const task = await response.json()
      
      console.log('Task status response:', task)
      
      // 只在日志数组有内容时才更新，避免闪烁
      if (task.logs && task.logs.length > 0) {
        setLogs(task.logs)
      }
      
      if (task.status === 'completed') {
        console.log('=== Task completed ===')
        console.log('Result:', task.result)
        setResult(task.result)
        setLoading(false)
      } else if (task.status === 'failed') {
        console.log('=== Task failed ===')
        console.log('Error:', task.error)
        setLoading(false)
      } else {
        console.log('=== Task still processing, polling in 2s ===')
        setTimeout(() => pollTaskStatus(id), 2000)
      }
    } catch (error: any) {
      console.error('Poll error:', error)
      setTimeout(() => pollTaskStatus(id), 2000)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            IGPSPORT 骑行轨迹生成器
          </h1>
          <p className="text-gray-600 text-lg">
            从 IGPSPORT 获取骑行数据并生成轨迹合成图和叠加地图
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>输入配置</CardTitle>
              </CardHeader>
              <CardContent>
                <RideForm onSubmit={handleSubmit} loading={loading} />
              </CardContent>
            </Card>

            <LogDisplay logs={logs} />
          </div>

          <div className="space-y-8">
            {result && <ResultPreview result={result} />}
          </div>
        </div>

        <footer className="text-center mt-16 text-sm text-gray-500">
          <p>© 2026 IGPSPORT 骑行轨迹生成器. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
