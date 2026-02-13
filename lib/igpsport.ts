export interface Activity {
  RideId: number
  MemberId: number
  Title: string
  sport: string
  sub_sport: string
  start_time: Date
  total_ascent: number
  total_descent: number
  total_calories: number
  total_distance: number
  total_elapsed_time: number
  total_moving_time: number
  avg_cadence: number
  max_cadence: number
  avg_heart_rate: number
  min_heart_rate: number
  max_heart_rate: number
  avg_power: number
  max_power: number
  avg_speed: number
  max_speed: number
  avg_temperature: number
  max_temperature: number
  intensity_factor: number
  normalized_power: number
  training_stress_score: number
}

export class IGPSPORTClient {
  private cookieJar: Map<string, string> = new Map()

  async login(username: string, password: string): Promise<void> {
    console.log('=== IGPSPORT Login ===')

    const loginUrl = 'https://my.igpsport.com/Auth/Login'

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
        redirect: 'manual' as RequestRedirect,
      })

      console.log('Login response status:', response.status)

      // 获取所有 Set-Cookie
      const setCookieHeaders = response.headers.getSetCookie() ?
        response.headers.getSetCookie() :
        [response.headers.get('Set-Cookie') || '']

      console.log('Set-Cookie headers count:', setCookieHeaders.length)

      if (setCookieHeaders.length === 0) {
        console.error('No Set-Cookie headers received')
        throw new Error('登录失败：无法获取登录 Cookie')
      }

      // 解析所有 Cookie
      for (const cookie of setCookieHeaders) {
        const cookieParts = cookie.split(';')[0]
        const [name, value] = cookieParts.split('=')
        if (name && value) {
          this.cookieJar.set(name.trim(), value.trim())
        }
      }

      console.log('Total cookies in jar:', this.cookieJar.size)

    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Login error stack:', error.stack)
      throw error
    }
  }

  private getCookieString(): string {
    const cookieString = Array.from(this.cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')

    return cookieString
  }

  private getHeaders() {
    const cookieString = this.getCookieString()
    
    // 添加 Authorization 头（使用 loginToken）
    const loginToken = this.cookieJar.get('loginToken')
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept-Encoding': 'gzip, deflate',
      'Cookie': cookieString,
    }
    
    if (loginToken) {
      headers['Authorization'] = `Bearer ${loginToken}`
    }

    return headers
  }

  private parseActivityDate(data: Record<string, unknown>): Date {
    const dateFields = ['StartTime', 'start_time', 'BeginTime', 'beginTime', 'Date', 'date']
    for (const field of dateFields) {
      const value = data[field]
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value)
      }
    }
    return new Date()
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

      const activitiesData = result.item || []
      console.log('Activities data length:', activitiesData.length)

      if (activitiesData.length > 0) {
        console.log('First activity keys:', Object.keys(activitiesData[0]))
        console.log('First activity sample:', JSON.stringify(activitiesData[0], null, 2))
      }

      const activities: Activity[] = activitiesData.map(
        (data: any) =>
          ({
            RideId: data.RideId,
            MemberId: data.MemberId,
            Title: data.Title,
            sport: 'None',
            sub_sport: 'None',
            start_time: this.parseActivityDate(data),
            total_ascent: 0,
            total_descent: 0,
            total_calories: 0,
            total_distance: 0,
            total_elapsed_time: 0,
            total_moving_time: 0,
            avg_cadence: 0,
            max_cadence: 0,
            avg_heart_rate: 0,
            min_heart_rate: 0,
            max_heart_rate: 0,
            avg_power: 0,
            max_power: 0,
            avg_speed: 0,
            max_speed: 0,
            avg_temperature: 0,
            max_temperature: 0,
            intensity_factor: 0,
            normalized_power: 0,
            training_stress_score: 0,
          }) satisfies Activity
      )

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
        headers: {
          'User-Agent': this.getHeaders()['User-Agent'],
        },
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
