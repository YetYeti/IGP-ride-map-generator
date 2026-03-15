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
        return 'text-rose-300'
      case 'success':
        return 'text-emerald-300'
      case 'warning':
        return 'text-amber-200'
      default:
        return 'text-white/80'
    }
  }

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <Card id={id} className="overflow-hidden">
      <CardHeader className="border-b border-white/10 bg-[#1f2229] pb-4">
        <span className="eyebrow !text-white/60">运行日志</span>
        <CardTitle className="text-[1.4rem] text-white">处理日志</CardTitle>
      </CardHeader>
      <CardContent className="bg-[#1f2229] p-0">
        <div
          ref={logContainerRef}
          className="custom-scrollbar h-[24rem] overflow-y-auto bg-[linear-gradient(180deg,#1f2229_0%,#171a20_100%)] p-5"
        >
          {logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/45">
              暂无日志
            </p>
           ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="break-words rounded-2xl border border-white/6 bg-white/4 px-4 py-3 text-sm font-mono">
                  <span className="text-white/35">[{log.timestamp}]</span>{' '}
                  <span className={getLevelColor(log.level)}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
