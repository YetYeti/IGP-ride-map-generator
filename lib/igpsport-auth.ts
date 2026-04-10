const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

export function buildIGPSPORTHeaders(cookieJar: Map<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept-Encoding': 'gzip, deflate',
    Cookie: buildCookieString(cookieJar),
  }

  const loginToken = cookieJar.get('loginToken')
  if (loginToken) {
    headers.Authorization = `Bearer ${loginToken}`
  }

  return headers
}

export function buildIGPSPORTDownloadHeaders(): Record<string, string> {
  return {
    'User-Agent': USER_AGENT,
  }
}

export function extractSetCookieHeaders(response: Response): string[] {
  const setCookieHeaders = response.headers.getSetCookie()
  if (setCookieHeaders.length > 0) {
    return setCookieHeaders
  }

  const fallbackHeader = response.headers.get('Set-Cookie')
  return fallbackHeader ? [fallbackHeader] : []
}

export function storeCookies(cookieJar: Map<string, string>, setCookieHeaders: string[]) {
  for (const cookie of setCookieHeaders) {
    const cookieParts = cookie.split(';')[0]
    const [name, value] = cookieParts.split('=')
    if (name && value) {
      cookieJar.set(name.trim(), value.trim())
    }
  }
}

function buildCookieString(cookieJar: Map<string, string>): string {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}
