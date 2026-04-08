'use client'

import React, { useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import type { GenerationLogEntry } from '@/lib/generation/types'

interface LogDisplayProps {
  logs?: GenerationLogEntry[]
  id?: string
  compact?: boolean
  maxEntries?: number
}

export function LogDisplay({ logs = [], id, compact = false, maxEntries }: LogDisplayProps) {
  const logContainerRef = useRef<HTMLDivElement>(null)
  const visibleLogs = React.useMemo(
    () => (maxEntries ? logs.slice(-maxEntries) : logs),
    [logs, maxEntries]
  )

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
      <CardHeader className={compact ? 'pb-2' : 'pb-2'}>
        <CardTitle className={compact ? 'text-base' : 'text-lg'}>运行日志</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={logContainerRef}
          className={`custom-scrollbar overflow-y-scroll bg-gray-50 ${
            compact ? 'h-[24rem] p-3' : 'h-96 p-4'
          } space-y-1`}
        >
          {visibleLogs.length === 0 ? (
            <p className={`text-center text-gray-500 ${compact ? 'py-4 text-xs' : 'py-8 text-sm'}`}>
              等待开始
            </p>
          ) : (
            visibleLogs.map((log, index) => (
              <div key={index} className={`break-words font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
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
