import { NextRequest, NextResponse } from 'next/server'
import { isRecord } from '@/lib/generation/request-parsing'
import { startAccountLogin } from '@/lib/session/session-login'
import { getAccountSessionSummary } from '@/lib/session/session-store'

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!isRecord(body)) {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 })
  }

  const username = body.username
  const password = body.password

  if (typeof username !== 'string' || username.trim() === '') {
    return NextResponse.json({ error: 'IGPSPORT账号必须填写' }, { status: 400 })
  }

  if (typeof password !== 'string' || password.trim() === '') {
    return NextResponse.json({ error: 'IGPSPORT密码必须填写' }, { status: 400 })
  }

  startAccountLogin(username.trim(), password)

  return NextResponse.json(
    {
      session: getAccountSessionSummary(),
    },
    { status: 202 }
  )
}
