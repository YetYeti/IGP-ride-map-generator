import type {
  CombinedMapOutputConfig,
  GenerationTaskRequest,
  OverlayMapOutputConfig,
  PosterOutputConfig,
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

export function updateRequestPoster(
  request: GenerationTaskRequest,
  poster: PosterOutputConfig
): GenerationTaskRequest {
  return {
    ...request,
    outputs: {
      ...request.outputs,
      poster,
    },
  }
}

export function getAvailableYears(currentYear: number, count: number = 10): number[] {
  const years: number[] = []

  for (let index = 0; index < count; index++) {
    years.push(currentYear - index)
  }

  return years
}

export function canSubmitRequest(
  request: GenerationTaskRequest,
  loading: boolean
): boolean {
  return (
    !loading &&
    request.credentials.username.trim() !== '' &&
    request.credentials.password.trim() !== ''
  )
}
