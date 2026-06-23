import { extractActivityItems, mapActivityItem } from '@/lib/igpsport-activity'
import {
  buildLoginBody,
  buildLoginHeaders,
  buildIGPSPORTHeaders,
  calculateExpiresAt,
  IGPSPORT_BASE_URL_EXPORTED,
  type IGPSPORTAuthState,
} from '@/lib/igpsport-auth'
import { logIGPSPORTError } from '@/lib/igpsport-errors'
import {
  downloadIGPSPORTFitFile,
  fetchIGPSPORTActivitiesPage,
  fetchIGPSPORTFitDownloadUrl,
} from '@/lib/igpsport-request'
export type { Activity } from '@/lib/igpsport-types'
import type { Activity } from '@/lib/igpsport-types'

const ACTIVITIES_PAGE_SIZE = 100
const LOGIN_URL = `${IGPSPORT_BASE_URL_EXPORTED}/auth/account/login`

interface IGPSPORTApiResult {
  code?: unknown
  message?: unknown
  data?: unknown
}

export class IGPSPORTClient {
  private authState: IGPSPORTAuthState | null = null

  private ensureLoggedIn() {
    if (!this.authState?.accessToken) {
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

    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: buildLoginHeaders(),
        body: buildLoginBody(username, password),
        signal: AbortSignal.timeout(30_000),
      })

      console.log('Login response status:', response.status)

      if (!response.ok) {
        console.error('Login request failed, status:', response.status)
        throw new Error(`登录失败：HTTP ${response.status}`)
      }

      const text = await response.text()
      const result = this.parseResultObject(text)

      this.raiseForBusinessError(result, '登录失败')

      const data = this.extractDataObject(result)
      const accessToken = this.extractStringField(data, 'access_token')
      if (!accessToken) {
        throw new Error('登录失败：未获取到 access_token')
      }

      const refreshToken = this.extractStringField(data, 'refresh_token') ?? ''
      const expiresAt = calculateExpiresAt(data?.expires_in)

      this.authState = { accessToken, refreshToken, expiresAt }
      console.log('Login successful, token expires at:', expiresAt?.toISOString() ?? 'unknown')
    } catch (error: unknown) {
      logIGPSPORTError('Login error:', error)
      throw error
    }
  }

  async getActivities(
    pageIndex: number = 1,
    pageSize: number = ACTIVITIES_PAGE_SIZE
  ): Promise<Activity[]> {
    this.ensureLoggedIn()

    const text = await fetchIGPSPORTActivitiesPage(this.authState, pageIndex, pageSize)

    if (this.hasEmptyResponseText(text, 'Empty response from activities API')) {
      return []
    }

    let result: IGPSPORTApiResult
    try {
      result = this.parseResultObject(text)
    } catch (error: unknown) {
      logIGPSPORTError('Failed to parse activities JSON:', error)
      throw new Error('活动列表数据解析失败')
    }

    this.raiseForBusinessError(result, '获取活动列表失败')

    const activitiesData = extractActivityItems(result as unknown as Record<string, unknown>)
    console.log('Activities data length:', activitiesData.length)
    if (activitiesData.length > 0) {
      console.log('First activity keys:', Object.keys(activitiesData[0]))
      console.log('First activity sample:', JSON.stringify(activitiesData[0], null, 2))
    }

    return activitiesData.map(mapActivityItem)
  }

  async downloadFitFile(rideId: number): Promise<Buffer> {
    this.ensureLoggedIn()

    console.log('=== Downloading FIT File ===')
    console.log('Ride ID:', rideId)

    try {
      const text = await fetchIGPSPORTFitDownloadUrl(this.authState, rideId)

      if (this.hasEmptyResponseText(text, 'Empty response from download URL API')) {
        throw new Error(`活动 ${rideId} 的详细数据未找到（空响应）`)
      }

      const result = this.parseResultObject(text)
      console.log('Download URL result keys:', Object.keys(result))

      const fitUrl = this.extractStringFieldFromUnknown(result, 'data')
      if (!fitUrl) {
        console.error('No data in response')
        throw new Error(`活动 ${rideId} 的详细数据未找到`)
      }

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
    const pageSize = ACTIVITIES_PAGE_SIZE

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

  private parseResultObject(text: string): IGPSPORTApiResult {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('IGPSPORT 响应格式异常')
    }

    return parsed as IGPSPORTApiResult
  }

  private raiseForBusinessError(result: IGPSPORTApiResult, default_message: string) {
    const code = result.code
    if (code === undefined || code === null || code === 0) {
      return
    }

    const message = result.message
    throw new Error(typeof message === 'string' && message ? message : default_message)
  }

  private extractDataObject(result: IGPSPORTApiResult): Record<string, unknown> | undefined {
    if (typeof result.data === 'object' && result.data !== null) {
      return result.data as Record<string, unknown>
    }

    return undefined
  }

  private extractStringField(
    source: Record<string, unknown> | undefined,
    field: string
  ): string | undefined {
    const value = source?.[field]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }

    return undefined
  }

  private extractStringFieldFromUnknown(source: unknown, field: string): string | undefined {
    if (typeof source !== 'object' || source === null) {
      return undefined
    }

    const value = (source as Record<string, unknown>)[field]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }

    return undefined
  }
}
