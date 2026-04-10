import {
  buildIGPSPORTDownloadHeaders,
  buildIGPSPORTHeaders,
} from '@/lib/igpsport-auth'

const REQUEST_TIMEOUT_MS = 30_000

export async function fetchIGPSPORTActivitiesPage(
  cookieJar: Map<string, string>,
  pageIndex: number,
  pageSize: number
) {
  const url = new URL('https://my.igpsport.com/Activity/ActivityList')
  url.searchParams.append('pageIndex', pageIndex.toString())
  url.searchParams.append('pageSize', pageSize.toString())

  console.log('=== Fetching Activities ===')
  console.log('Page:', pageIndex, 'PageSize:', pageSize)
  console.log('URL:', url.toString())

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildIGPSPORTHeaders(cookieJar),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  console.log('Activities response status:', response.status)

  if (!response.ok) {
    console.error('Activities request failed, status:', response.status)
    throw new Error('获取活动列表失败')
  }

  const text = await response.text()
  console.log('Activities response length:', text.length)

  return text
}

export async function fetchIGPSPORTFitDownloadUrl(
  cookieJar: Map<string, string>,
  rideId: number
) {
  const fitJsonUrl =
    `https://prod.zh.igpsport.com/service/web-gateway/web-analyze/activity/getDownloadUrl/${rideId}`

  const response = await fetch(fitJsonUrl, {
    method: 'GET',
    headers: buildIGPSPORTHeaders(cookieJar),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    console.error('Get download URL failed, status:', response.status)
    throw new Error(`获取活动 ${rideId} 的下载链接失败`)
  }

  const text = await response.text()
  console.log('Download URL response length:', text.length)

  return text
}

export async function downloadIGPSPORTFitFile(fitUrl: string) {
  const response = await fetch(fitUrl, {
    method: 'GET',
    headers: buildIGPSPORTDownloadHeaders(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    console.error('Download FIT file failed, status:', response.status)
    throw new Error(`下载 FIT 文件失败`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log('FIT file downloaded, size:', arrayBuffer.byteLength)

  return Buffer.from(arrayBuffer)
}
