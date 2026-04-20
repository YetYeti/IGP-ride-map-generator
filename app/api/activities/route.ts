import { NextRequest, NextResponse } from 'next/server'
import { IGPSPORTClient } from '@/lib/igpsport'
import { getErrorMessage } from '@/lib/error-utils'
import {
  filterActivitiesByYear,
  filterOutdoorActivities,
} from '@/lib/generation/activity-filtering'
import { buildPosterActivityOptions } from '@/lib/generation/poster-activity-options'
import { isRecord, parseYear } from '@/lib/generation/request-parsing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!isRecord(body)) {
      return NextResponse.json({ error: '请求体格式错误' }, { status: 400 })
    }

    const credentials = body.credentials
    if (!isRecord(credentials)) {
      return NextResponse.json({ error: '缺少 credentials 配置' }, { status: 400 })
    }

    const username = credentials.username
    const password = credentials.password
    if (typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json({ error: 'IGPSPORT账号必须填写' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json({ error: 'IGPSPORT密码必须填写' }, { status: 400 })
    }

    const year = parseYear(isRecord(body.filters) ? body.filters.year : undefined)
    if (year === null) {
      return NextResponse.json({ error: '年份配置无效' }, { status: 400 })
    }

    const client = new IGPSPORTClient()
    await client.login(username.trim(), password)

    const activities = await client.getAllActivities()
    const outdoorActivities = filterOutdoorActivities(activities)
    const filteredActivities = filterActivitiesByYear(outdoorActivities, year)
    const options = buildPosterActivityOptions(filteredActivities)

    return NextResponse.json({ activities: options })
  } catch (error: unknown) {
    console.error('获取可选活动失败:', error)

    return NextResponse.json(
      { error: getErrorMessage(error) || '获取可选活动失败' },
      { status: 500 }
    )
  }
}
