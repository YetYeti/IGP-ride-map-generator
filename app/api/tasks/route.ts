import { NextRequest, NextResponse } from 'next/server'
import { restoreActivitiesFromSnapshot } from '@/lib/generation/activity-snapshot'
import { parseGenerationTaskRequest } from '@/lib/generation/request'
import {
  acceptedTaskResponse,
  badTaskRequestResponse,
  serverErrorResponse,
} from '@/lib/generation/task-route'
import { isRecord } from '@/lib/generation/request-parsing'
import { startTaskRun } from '@/lib/generation/task-runner'
import { createTask, getRunningTaskCount } from '@/lib/generation/task-store'
import type { ActivitySnapshot, CreateGenerationTaskPayload } from '@/lib/generation/types'

const MAX_CONCURRENT_TASKS = 3

export async function POST(req: NextRequest) {
  try {
    if (getRunningTaskCount() >= MAX_CONCURRENT_TASKS) {
      return NextResponse.json(
        { error: '当前任务过多，请稍后重试' },
        { status: 429 }
      )
    }

    const body = (await req.json()) as CreateGenerationTaskPayload

    if (!isRecord(body)) {
      return badTaskRequestResponse('请求体格式错误')
    }

    const { request, error } = parseGenerationTaskRequest(body.request)

    if (!request) {
      return badTaskRequestResponse(error)
    }

    const credentials = parseCredentials(body.credentials)
    if (!credentials) {
      return NextResponse.json(
        { error: '请先登录账号并完成活动获取' },
        { status: 400 }
      )
    }

    const activitySnapshot = parseActivitySnapshot(body.activitySnapshot)
    if (!activitySnapshot) {
      return NextResponse.json(
        { error: '当前账号活动数据不可用，请重新登录' },
        { status: 400 }
      )
    }

    const task = createTask()
    startTaskRun(task.id, request, credentials, {
      totalActivityCount: activitySnapshot.totalActivityCount,
      outdoorActivityCount: activitySnapshot.outdoorActivityCount,
      activities: restoreActivitiesFromSnapshot(activitySnapshot.activities),
    })

    return acceptedTaskResponse(task)
  } catch (error: unknown) {
    console.error('创建任务失败:', error)

    return serverErrorResponse()
  }
}

function parseCredentials(value: unknown): { username: string; password: string } | null {
  if (!isRecord(value)) {
    return null
  }

  const username = value.username
  const password = value.password

  if (typeof username !== 'string' || username.trim() === '') {
    return null
  }

  if (typeof password !== 'string' || password === '') {
    return null
  }

  return {
    username: username.trim(),
    password,
  }
}

function parseActivitySnapshot(value: unknown): ActivitySnapshot | null {
  if (!isRecord(value)) {
    return null
  }

  const totalActivityCount = value.totalActivityCount
  const outdoorActivityCount = value.outdoorActivityCount
  const activities = value.activities

  if (
    typeof totalActivityCount !== 'number' ||
    typeof outdoorActivityCount !== 'number' ||
    !Array.isArray(activities)
  ) {
    return null
  }

  return {
    totalActivityCount,
    outdoorActivityCount,
    activities,
  } as ActivitySnapshot
}
