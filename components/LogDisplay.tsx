'use client'

import React, { useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import type { GenerationLogEntry } from '@/lib/generation/types'

interface LogDisplayProps {
  logs?: GenerationLogEntry[]
  id?: string
}

export function LogDisplay({ logs = [], id }: LogDisplayProps) {
  const logContainerRef = useRef<HTMLDivElement>(null)

  const getLevelColor = (level: GenerationLogEntry['level']) => {
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
        <div ref={logContainerRef} className="custom-scrollbar h-96 overflow-y-auto bg-gray-50 p-4 space-y-1">
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              暂无日志
            </p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="break-words text-sm font-mono">
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
