import type {
  CombinedMapOutputConfig,
  GenerationTaskRequest,
  OverlayMapOutputConfig,
} from '@/lib/generation/types'

export function syncRequestCredentials(
  request: GenerationTaskRequest,
  username: string,
  password: string
): GenerationTaskRequest {
  if (
    request.credentials.username === username &&
    request.credentials.password === password
  ) {
    return request
  }

  return {
    ...request,
    credentials: {
      ...request.credentials,
      username,
      password,
    },
  }
}

export function updateRequestUsername(
  request: GenerationTaskRequest,
  username: string
): GenerationTaskRequest {
  return {
    ...request,
    credentials: {
      ...request.credentials,
      username,
    },
  }
}

export function updateRequestPassword(
  request: GenerationTaskRequest,
  password: string
): GenerationTaskRequest {
  return {
    ...request,
    credentials: {
      ...request.credentials,
      password,
    },
  }
}

export function updateRequestYear(
  request: GenerationTaskRequest,
  year: number | 'all'
): GenerationTaskRequest {
  return {
    ...request,
    filters: {
      year,
    },
  }
}

export function updateRequestCombinedMap(
  request: GenerationTaskRequest,
  combinedMap: CombinedMapOutputConfig
): GenerationTaskRequest {
  return {
    ...request,
    outputs: {
      ...request.outputs,
      combinedMap,
    },
  }
}

export function updateRequestOverlayMap(
  request: GenerationTaskRequest,
  overlayMap: OverlayMapOutputConfig
): GenerationTaskRequest {
  return {
    ...request,
    outputs: {
      ...request.outputs,
      overlayMap,
    },
  }
}
