import { extractActivityItems, mapActivityItem } from '@/lib/igpsport-activity'
import {
  buildIGPSPORTHeaders,
  extractSetCookieHeaders,
  storeCookies,
} from '@/lib/igpsport-auth'
import { logIGPSPORTError } from '@/lib/igpsport-errors'
import {
  downloadIGPSPORTFitFile,
  fetchIGPSPORTActivitiesPage,
  fetchIGPSPORTFitDownloadUrl,
} from '@/lib/igpsport-request'
export type { Activity } from '@/lib/igpsport-types'
import type { Activity } from '@/lib/igpsport-types'

export class IGPSPORTClient {
  private cookieJar: Map<string, string> = new Map()

  private ensureLoggedIn() {
    if (this.cookieJar.size === 0) {
      throw new Error('未登录，请先调用 login 方法')
    }
  }

  private hasEmptyResponseText(text: string, logMessage: string): boolean {
    if (!text || text.trim().length === 0) {
      console.error(logMessage)
      return true
    }

    return false
  }

  async login(username: string, password: string): Promise<void> {
    console.log('=== IGPSPORT Login ===')

    const loginUrl = 'https://my.igpsport.com/Auth/Login'

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: buildIGPSPORTHeaders(this.cookieJar),
        body: new URLSearchParams({
          username,
          password,
        }),
        redirect: 'manual' as RequestRedirect,
      })

      console.log('Login response status:', response.status)

      // 获取所有 Set-Cookie
      const setCookieHeaders = extractSetCookieHeaders(response)
      console.log('Set-Cookie headers count:', setCookieHeaders.length)

      if (setCookieHeaders.length === 0) {
        console.error('No Set-Cookie headers received')
        throw new Error('登录失败：无法获取登录 Cookie')
      }

      // 解析所有 Cookie
      storeCookies(this.cookieJar, setCookieHeaders)

      console.log('Total cookies in jar:', this.cookieJar.size)

    } catch (error: unknown) {
      logIGPSPORTError('Login error:', error)
      throw error
    }
  }

  async getActivities(
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<Activity[]> {
    this.ensureLoggedIn()

    try {
      const text = await fetchIGPSPORTActivitiesPage(this.cookieJar, pageIndex, pageSize)

      if (this.hasEmptyResponseText(text, 'Empty response from activities API')) {
        return []
      }

      const result = JSON.parse(text)
      const activitiesData = extractActivityItems(result)
      console.log('Activities data length:', activitiesData.length)

      if (activitiesData.length > 0) {
        console.log('First activity keys:', Object.keys(activitiesData[0]))
        console.log('First activity sample:', JSON.stringify(activitiesData[0], null, 2))
      }

      const activities = activitiesData.map(mapActivityItem)

      return activities
    } catch (error: unknown) {
      logIGPSPORTError('Get activities error:', error)
      return []
    }
  }

  async downloadFitFile(rideId: number): Promise<Buffer> {
    this.ensureLoggedIn()

    console.log('=== Downloading FIT File ===')
    console.log('Ride ID:', rideId)

    try {
      const text = await fetchIGPSPORTFitDownloadUrl(this.cookieJar, rideId)

      if (this.hasEmptyResponseText(text, 'Empty response from download URL API')) {
        throw new Error(`活动 ${rideId} 的详细数据未找到（空响应）`)
      }

      const jsonResult = JSON.parse(text)
      console.log('Download URL result keys:', Object.keys(jsonResult))

      if (!jsonResult.data) {
        console.error('No data in response')
        throw new Error(`活动 ${rideId} 的详细数据未找到`)
      }

      const fitUrl = jsonResult.data
      console.log('FIT URL obtained:', fitUrl)

      return downloadIGPSPORTFitFile(fitUrl)
    } catch (error: unknown) {
      logIGPSPORTError('Download FIT file error:', error)
      throw error
    }
  }

  async getAllActivities(onProgress?: (page: number, total: number) => void): Promise<Activity[]> {
    const allActivities: Activity[] = []
    let pageIndex = 1
    const pageSize = 20

    while (true) {
      console.log(`=== Fetching page ${pageIndex} ===`)
      const activities = await this.getActivities(pageIndex, pageSize)

      if (activities.length === 0) {
        console.log('No more activities, stopping')
        break
      }

      allActivities.push(...activities)
      onProgress?.(pageIndex, allActivities.length)
      pageIndex++
    }

    console.log(`=== Total activities fetched: ${allActivities.length} ===`)
    return allActivities
  }
}
