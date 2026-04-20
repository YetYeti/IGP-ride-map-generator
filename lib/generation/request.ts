import {
  createInitialTaskRequest,
  DEFAULT_COMBINED_MAP_OUTPUT,
  DEFAULT_OVERLAY_MAP_OUTPUT,
  DEFAULT_POSTER_OUTPUT,
} from '@/lib/generation/request-defaults'
import {
  parseCombinedMapOutput,
  parseOverlayMapOutput,
  parsePosterOutput,
} from '@/lib/generation/request-outputs'
import { isRecord, parseYear } from '@/lib/generation/request-parsing'
import type { GenerationTaskRequest } from '@/lib/generation/types'

export {
  createInitialTaskRequest,
  DEFAULT_COMBINED_MAP_OUTPUT,
  DEFAULT_OVERLAY_MAP_OUTPUT,
  DEFAULT_POSTER_OUTPUT,
}

export function parseGenerationTaskRequest(body: unknown): {
  request?: GenerationTaskRequest
  error?: string
} {
  if (!isRecord(body)) {
    return { error: '请求体格式错误' }
  }

  const credentialsValue = body.credentials
  const username = isRecord(credentialsValue) ? credentialsValue.username : undefined
  const password = isRecord(credentialsValue) ? credentialsValue.password : undefined

  const initialRequest = createInitialTaskRequest()

  if (body.filters !== undefined) {
    if (!isRecord(body.filters)) {
      return { error: 'filters 配置格式错误' }
    }

    const year = parseYear(body.filters.year)
    if (year === null) {
      return { error: '年份配置无效' }
    }

    initialRequest.filters.year = year
  }

  if (body.outputs !== undefined) {
    if (!isRecord(body.outputs)) {
      return { error: 'outputs 配置格式错误' }
    }

    const combinedMap = parseCombinedMapOutput(body.outputs.combinedMap)
    if (!combinedMap) {
      return { error: 'combinedMap 配置无效' }
    }

    const overlayMap = parseOverlayMapOutput(body.outputs.overlayMap)
    if (!overlayMap) {
      return { error: 'overlayMap 配置无效' }
    }

    const poster = parsePosterOutput(body.outputs.poster)
    if (!poster) {
      return { error: 'poster 配置无效' }
    }

    if (poster.enabled && poster.activityMode === 'single' && poster.selectedRideId === null) {
      return { error: '海报单活动模式必须选择一个活动' }
    }

    initialRequest.outputs.combinedMap = combinedMap
    initialRequest.outputs.overlayMap = overlayMap
    initialRequest.outputs.poster = poster
  }

  if (typeof username === 'string' && username.trim() !== '' && typeof password === 'string') {
    initialRequest.credentials = {
      username: username.trim(),
      password,
    }
  }

  return { request: initialRequest }
}
