import { updateRequestedOutputsProgress } from '@/lib/generation/output-progress'
import { filterActivitiesByYear } from '@/lib/generation/activity-filtering'
import {
  appendTaskLog,
  setTaskFailed,
  setTaskProgress,
  updateTaskStats,
} from '@/lib/generation/task-store'
import type { GenerationTaskRequest } from '@/lib/generation/types'
import type { Activity, IGPSPORTClient } from '@/lib/igpsport'

interface SessionActivitySnapshot {
  totalActivityCount: number
  outdoorActivityCount: number
  activities: Activity[]
}

export async function collectFilteredActivities(
  taskId: string,
  client: IGPSPORTClient,
  request: GenerationTaskRequest,
  credentials: { username: string; password: string },
  sessionActivitySnapshot: SessionActivitySnapshot
): Promise<Activity[] | null> {
  appendTaskLog(taskId, '正在复用已获取的骑行活动数据...', 'info')
  setTaskProgress(taskId, 15)
  updateRequestedOutputsProgress(taskId, request, 18, 'pending')

  const filteredActivities = filterActivitiesByYear(
    sessionActivitySnapshot.activities,
    request.filters.year
  )

  updateTaskStats(taskId, {
    totalActivities: sessionActivitySnapshot.totalActivityCount,
    outdoorActivities: sessionActivitySnapshot.outdoorActivityCount,
    filteredActivities: filteredActivities.length,
  })

  if (filteredActivities.length === 0) {
    const yearLabel = request.filters.year === 'all' ? '当前筛选条件' : `${request.filters.year} 年`
    const errorMessage = `${yearLabel}没有户外骑行数据，请选择其他年份或“全部年份”`
    appendTaskLog(taskId, `${yearLabel}没有户外骑行数据`, 'error')
    setTaskFailed(taskId, errorMessage)
    return null
  }

  filteredActivities.sort((left, right) => left.RideId - right.RideId)
  appendTaskLog(taskId, `找到 ${filteredActivities.length} 个户外骑行`, 'info')
  setTaskProgress(taskId, 25)
  updateRequestedOutputsProgress(taskId, request, 25, 'pending')

  appendTaskLog(taskId, '正在登录 IGPSPORT...', 'info')
  await client.login(credentials.username, credentials.password)
  appendTaskLog(taskId, '登录成功', 'success')
  setTaskProgress(taskId, 30)
  updateRequestedOutputsProgress(taskId, request, 30, 'pending')

  return filteredActivities
}
