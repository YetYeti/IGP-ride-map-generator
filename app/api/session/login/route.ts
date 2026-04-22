import { NextRequest, NextResponse } from 'next/server'
import { buildActivitySnapshot } from '@/lib/generation/activity-snapshot'
import { filterOutdoorActivities } from '@/lib/generation/activity-filtering'
import { buildPosterActivityOptions } from '@/lib/generation/poster-activity-options'
import { isRecord } from '@/lib/generation/request-parsing'
import { IGPSPORTClient } from '@/lib/igpsport'
import { startSessionWarmup } from '@/lib/session/session-warmup'

export async function POST(req: NextRequest) {
  try {
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

    const normalizedUsername = username.trim()
    const client = new IGPSPORTClient()
    await client.login(normalizedUsername, password)

    const activities = await client.getAllActivities()
    const outdoorActivities = filterOutdoorActivities(activities)

    startSessionWarmup({ username: normalizedUsername, password }, outdoorActivities)

    return NextResponse.json({
      session: {
        status: 'ready',
        username: normalizedUsername,
        progress: 100,
        outdoorActivityCount: outdoorActivities.length,
        activities: buildPosterActivityOptions(outdoorActivities),
        error: null,
        updatedAt: new Date().toISOString(),
      },
      activitySnapshot: buildActivitySnapshot(activities.length, outdoorActivities),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '账号登录失败',
      },
      { status: 500 }
    )
  }
}
