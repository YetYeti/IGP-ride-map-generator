import { extractActivityItems, mapActivityItem } from '@/lib/igpsport-activity'
import {
  buildIGPSPORTDownloadHeaders,
  buildIGPSPORTHeaders,
  extractSetCookieHeaders,
  storeCookies,
} from '@/lib/igpsport-auth'
export type { Activity } from '@/lib/igpsport-types'
import type { Activity } from '@/lib/igpsport-types'

export class IGPSPORTClient {
  private cookieJar: Map<string, string> = new Map()

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

    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Login error stack:', error.stack)
      throw error
    }
  }

  private getHeaders() {
    return buildIGPSPORTHeaders(this.cookieJar)
  }

  async getActivities(
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<Activity[]> {
    if (this.cookieJar.size === 0) {
      throw new Error('未登录，请先调用 login 方法')
    }

    const url = new URL('https://my.igpsport.com/Activity/ActivityList')
    url.searchParams.append('pageIndex', pageIndex.toString())
    url.searchParams.append('pageSize', pageSize.toString())

    console.log('=== Fetching Activities ===')
    console.log('Page:', pageIndex, 'PageSize:', pageSize)
    console.log('URL:', url.toString())

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      })

      console.log('Activities response status:', response.status)

      if (!response.ok) {
        console.error('Activities request failed, status:', response.status)
        throw new Error('获取活动列表失败')
      }

      const text = await response.text()
      console.log('Activities response length:', text.length)

      if (!text || text.trim().length === 0) {
        console.error('Empty response from activities API')
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
    } catch (error: any) {
      console.error('Get activities error:', error)
      console.error('Get activities error stack:', error.stack)
      return []
    }
  }

  async downloadFitFile(rideId: number): Promise<Buffer> {
    if (this.cookieJar.size === 0) {
      throw new Error('未登录，请先调用 login 方法')
    }

    const fitJsonUrl = `https://prod.zh.igpsport.com/service/web-gateway/web-analyze/activity/getDownloadUrl/${rideId}`

    console.log('=== Downloading FIT File ===')
    console.log('Ride ID:', rideId)

    try {
      const jsonResponse = await fetch(fitJsonUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!jsonResponse.ok) {
        console.error('Get download URL failed, status:', jsonResponse.status)
        throw new Error(`获取活动 ${rideId} 的下载链接失败`)
      }

      const text = await jsonResponse.text()
      console.log('Download URL response length:', text.length)

      if (!text || text.trim().length === 0) {
        console.error('Empty response from download URL API')
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

      const fitResponse = await fetch(fitUrl, {
        method: 'GET',
        headers: buildIGPSPORTDownloadHeaders(),
      })

      if (!fitResponse.ok) {
        console.error('Download FIT file failed, status:', fitResponse.status)
        throw new Error(`下载 FIT 文件 ${rideId}.fit 失败`)
      }

      const arrayBuffer = await fitResponse.arrayBuffer()
      console.log('FIT file downloaded, size:', arrayBuffer.byteLength)

      return Buffer.from(arrayBuffer)
    } catch (error: any) {
      console.error('Download FIT file error:', error)
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
