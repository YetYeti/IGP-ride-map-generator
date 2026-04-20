import { updateRequestedOutputsProgress } from '@/lib/generation/output-progress'
import {
  filterActivitiesByYear,
  filterOutdoorActivities,
} from '@/lib/generation/activity-filtering'
import {
  appendTaskLog,
  setTaskFailed,
  setTaskProgress,
  updateTaskStats,
} from '@/lib/generation/task-store'
import type { GenerationTaskRequest } from '@/lib/generation/types'
import type { Activity, IGPSPORTClient } from '@/lib/igpsport'

export async function collectFilteredActivities(
  taskId: string,
  client: IGPSPORTClient,
  request: GenerationTaskRequest,
  credentials: { username: string; password: string }
): Promise<Activity[] | null> {
  appendTaskLog(taskId, '正在登录 IGPSPORT...', 'info')
  await client.login(credentials.username, credentials.password)
  appendTaskLog(taskId, '登录成功', 'success')
  setTaskProgress(taskId, 10)
  updateRequestedOutputsProgress(taskId, request, 12, 'pending')

  const activities = await client.getAllActivities((page) => {
    appendTaskLog(taskId, `正在获取第 ${page} 页活动...`, 'info')
    setTaskProgress(taskId, Math.min(25, 10 + page * 2))
    updateRequestedOutputsProgress(taskId, request, Math.min(24, 12 + page * 2), 'pending')
  })

  const outdoorActivities = filterOutdoorActivities(activities)
  const filteredActivities = filterActivitiesByYear(outdoorActivities, request.filters.year)

  updateTaskStats(taskId, {
    totalActivities: activities.length,
    outdoorActivities: outdoorActivities.length,
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
  setTaskProgress(taskId, 30)
  updateRequestedOutputsProgress(taskId, request, 30, 'pending')

  return filteredActivities
}
