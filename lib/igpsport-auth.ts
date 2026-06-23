// IGPSPORT 新版认证：基于 JWT access_token（Bearer 头），不再依赖 Cookie。
// 参考 igp-ride 项目的实现：登录接口 /auth/account/login 返回 access_token / refresh_token。

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

const IGPSPORT_BASE_URL = 'https://prod.zh.igpsport.com/service'
const IGPSPORT_WEB_APP_ID = 'igpsport-web'

export interface IGPSPORTAuthState {
  accessToken: string
  refreshToken: string
  expiresAt: Date | null
}

export const IGPSPORT_BASE_URL_EXPORTED = IGPSPORT_BASE_URL

export function buildIGPSPORTHeaders(auth: IGPSPORTAuthState | null): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  }

  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`
  }

  return headers
}

export function buildIGPSPORTDownloadHeaders(): Record<string, string> {
  return {
    'User-Agent': USER_AGENT,
  }
}

export function buildLoginHeaders(): Record<string, string> {
  return {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  }
}

export function buildLoginBody(username: string, password: string): string {
  return JSON.stringify({
    appId: IGPSPORT_WEB_APP_ID,
    username,
    password,
  })
}

export function calculateExpiresAt(expiresIn: unknown): Date | null {
  if (typeof expiresIn === 'boolean') {
    return null
  }

  if (typeof expiresIn === 'number' && expiresIn > 0) {
    return new Date(Date.now() + expiresIn * 1000)
  }

  return null
}
