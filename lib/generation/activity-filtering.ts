import type { Activity } from '@/lib/igpsport'

export function filterOutdoorActivities(activities: Activity[]): Activity[] {
  return activities.filter((activity) => activity.Title !== '室内骑行')
}

export function filterActivitiesByYear(
  activities: Activity[],
  selectedYear: number | 'all'
): Activity[] {
  if (selectedYear === 'all') {
    return [...activities]
  }

  return activities.filter((activity) => activity.start_time.getFullYear() === selectedYear)
}
