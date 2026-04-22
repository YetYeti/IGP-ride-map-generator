import type { Activity } from '@/lib/igpsport'
import type { ActivitySnapshot, ActivitySnapshotItem } from '@/lib/generation/types'

export function buildActivitySnapshot(
  totalActivityCount: number,
  outdoorActivities: Activity[]
): ActivitySnapshot {
  return {
    totalActivityCount,
    outdoorActivityCount: outdoorActivities.length,
    activities: outdoorActivities.map(serializeActivity),
  }
}

export function restoreActivitiesFromSnapshot(snapshot: ActivitySnapshotItem[]): Activity[] {
  return snapshot.map((activity) => ({
    ...activity,
    start_time: new Date(activity.start_time),
  }))
}

function serializeActivity(activity: Activity): ActivitySnapshotItem {
  return {
    ...activity,
    start_time: activity.start_time.toISOString(),
  }
}
