'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useCredentialAutofillSync } from '@/hooks/useCredentialAutofillSync'
import type { AccountSessionSummary } from '@/lib/generation/types'

interface AccountSessionCardProps {
  session: AccountSessionSummary
  error: string | null
  onLogin: (username: string, password: string) => Promise<void>
  onLogout: () => Promise<void>
}

export function AccountSessionCard({
  session,
  error,
  onLogin,
  onLogout,
}: AccountSessionCardProps) {
  const [credentials, setCredentials] = React.useState({
    username: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = React.useState({
    username: '',
    password: '',
  })
  const [submitting, setSubmitting] = React.useState(false)
  const usernameInputRef = React.useRef<HTMLInputElement | null>(null)
  const passwordInputRef = React.useRef<HTMLInputElement | null>(null)

  useCredentialAutofillSync({
    usernameInputRef,
    passwordInputRef,
    onSync: (username, password) => {
      setCredentials({ username, password })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const username = usernameInputRef.current?.value ?? credentials.username
    const password = passwordInputRef.current?.value ?? credentials.password
    const nextErrors = {
      username: username.trim() === '' ? '请输入账号' : '',
      password: password.trim() === '' ? '请输入密码' : '',
    }

    setFieldErrors(nextErrors)

    if (nextErrors.username || nextErrors.password) {
      return
    }

    setSubmitting(true)
    try {
      await onLogin(username, password)
      setCredentials({ username, password })
    } finally {
      setSubmitting(false)
    }
  }

  const isBusy =
    submitting || session.status === 'logging_in' || session.status === 'loading_activities'

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-gray-200">
        <CardTitle>账号信息</CardTitle>
        <p className="text-sm text-gray-600">
          登录后自动获取户外骑行活动。
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {session.status === 'ready' ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">
                当前账号：{session.username}
              </p>
              <p className="text-sm text-gray-700">
                共 {session.outdoorActivityCount} 条户外骑行活动
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void onLogout()}
            >
              退出登录
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isBusy || session.status === 'failed' ? (
              <>
                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    {session.username ? `当前账号：${session.username}` : '正在处理账号登录'}
                  </p>
                  {isBusy ? (
                    <p className="text-sm text-gray-700">
                      {session.status === 'logging_in' ? '正在登录账号...' : '正在获取骑行活动...'}
                    </p>
                  ) : null}

                  {isBusy ? (
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gray-900 transition-all"
                        style={{ width: `${Math.max(session.progress, 8)}%` }}
                      />
                    </div>
                  ) : null}
                  {isBusy ? <p className="text-xs text-gray-500">进度 {session.progress}%</p> : null}
                </div>

                {session.status === 'failed' && session.error ? (
                  <p className="text-sm text-red-600">{session.error}</p>
                ) : null}

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => void onLogout()}
                  disabled={isBusy}
                >
                  {isBusy ? '正在获取骑行活动...' : '退出登录'}
                </Button>
              </>
            ) : (
              <>
                <Input
                  ref={usernameInputRef}
                  label="IGPSPORT 账号"
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder="请输入您的 IGPSPORT 账号"
                  value={credentials.username}
                  className={
                    fieldErrors.username
                      ? 'border-red-500 text-red-600 placeholder:text-red-500 focus-visible:ring-red-400'
                      : ''
                  }
                  onChange={(e) => {
                    const username = e.currentTarget.value
                    setFieldErrors((prev) => ({ ...prev, username: '' }))
                    setCredentials((prev) => ({ ...prev, username }))
                  }}
                  onFocus={() => setFieldErrors((prev) => ({ ...prev, username: '' }))}
                  disabled={isBusy}
                />

                <Input
                  ref={passwordInputRef}
                  label="密码"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="请输入您的密码"
                  value={credentials.password}
                  className={
                    fieldErrors.password
                      ? 'border-red-500 text-red-600 placeholder:text-red-500 focus-visible:ring-red-400'
                      : ''
                  }
                  onChange={(e) => {
                    const password = e.currentTarget.value
                    setFieldErrors((prev) => ({ ...prev, password: '' }))
                    setCredentials((prev) => ({ ...prev, password }))
                  }}
                  onFocus={() => setFieldErrors((prev) => ({ ...prev, password: '' }))}
                  disabled={isBusy}
                />

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <Button type="submit" className="w-full" disabled={isBusy}>
                  登录
                </Button>
              </>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}
