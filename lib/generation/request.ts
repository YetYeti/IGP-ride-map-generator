import {
  createInitialTaskRequest,
  DEFAULT_COMBINED_MAP_OUTPUT,
  DEFAULT_OVERLAY_MAP_OUTPUT,
  LAYOUT_PRESETS,
} from '@/lib/generation/request-defaults'
import { isRecord, parseNumber, parseYear } from '@/lib/generation/request-parsing'
import { MapStyles } from '@/lib/map-styles'
import type {
  CombinedMapLayoutPreset,
  CombinedMapOutputConfig,
  GenerationTaskRequest,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

export {
  createInitialTaskRequest,
  DEFAULT_COMBINED_MAP_OUTPUT,
  DEFAULT_OVERLAY_MAP_OUTPUT,
}

export function parseGenerationTaskRequest(body: unknown): {
  request?: GenerationTaskRequest
  error?: string
} {
  if (!isRecord(body)) {
    return { error: '请求体格式错误' }
  }

  const credentialsValue = body.credentials
  if (!isRecord(credentialsValue)) {
    return { error: '缺少 credentials 配置' }
  }

  const username = credentialsValue.username
  const password = credentialsValue.password

  if (typeof username !== 'string' || username.trim() === '') {
    return { error: 'IGPSPORT账号必须填写' }
  }

  if (typeof password !== 'string' || password.trim() === '') {
    return { error: 'IGPSPORT密码必须填写' }
  }

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

    initialRequest.outputs.combinedMap = combinedMap
    initialRequest.outputs.overlayMap = overlayMap
  }

  initialRequest.credentials = {
    username: username.trim(),
    password,
  }

  return { request: initialRequest }
}

function parseCombinedMapOutput(value: unknown): CombinedMapOutputConfig | null {
  if (value === undefined) {
    return { ...DEFAULT_COMBINED_MAP_OUTPUT }
  }

  if (!isRecord(value)) {
    return null
  }

  const enabled = typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_COMBINED_MAP_OUTPUT.enabled
  const layoutPreset = isLayoutPreset(value.layoutPreset)
    ? value.layoutPreset
    : DEFAULT_COMBINED_MAP_OUTPUT.layoutPreset
  const trackWidth = parseNumber(value.trackWidth, DEFAULT_COMBINED_MAP_OUTPUT.trackWidth)
  const trackSpacing = parseNumber(value.trackSpacing, DEFAULT_COMBINED_MAP_OUTPUT.trackSpacing)
  const columns = parseNumber(value.columns, DEFAULT_COMBINED_MAP_OUTPUT.columns)
  const trackPadding = parseNumber(value.trackPadding, DEFAULT_COMBINED_MAP_OUTPUT.trackPadding)

  if (
    trackWidth === null ||
    trackSpacing === null ||
    columns === null ||
    trackPadding === null
  ) {
    return null
  }

  return {
    enabled,
    layoutPreset,
    trackWidth,
    trackSpacing,
    columns,
    trackPadding,
  }
}

function parseOverlayMapOutput(value: unknown): OverlayMapOutputConfig | null {
  if (value === undefined) {
    return { ...DEFAULT_OVERLAY_MAP_OUTPUT }
  }

  if (!isRecord(value)) {
    return null
  }

  const enabled = typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_OVERLAY_MAP_OUTPUT.enabled
  const style = isMapStyle(value.style) ? value.style : DEFAULT_OVERLAY_MAP_OUTPUT.style

  return {
    enabled,
    style,
  }
}

function isMapStyle(value: unknown): value is OverlayMapOutputConfig['style'] {
  return typeof value === 'string' && value in MapStyles
}

function isLayoutPreset(value: unknown): value is CombinedMapLayoutPreset {
  return typeof value === 'string' && LAYOUT_PRESETS.includes(value as CombinedMapLayoutPreset)
}
