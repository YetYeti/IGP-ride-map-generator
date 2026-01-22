'use client'

import React, { useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'

export interface LogEntry {
  timestamp: string
  message: string
  level: 'info' | 'success' | 'error' | 'warning'
}

interface LogDisplayProps {
  logs?: LogEntry[]
  id?: string
}

export function LogDisplay({ logs = [], id }: LogDisplayProps) {
  const logContainerRef = useRef<HTMLDivElement>(null)

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600'
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-gray-900'
    }
  }

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <Card id={id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">处理日志</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={logContainerRef} className="h-96 overflow-y-auto custom-scrollbar bg-gray-50 p-4 space-y-1">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              暂无日志
            </p>
           ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono break-words">
                <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                <span className={getLevelColor(log.level)}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
