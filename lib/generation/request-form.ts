import type {
  CombinedMapOutputConfig,
  GenerationTaskRequest,
  OverlayMapOutputConfig,
  PosterActivityMode,
  PosterOutputConfig,
} from '@/lib/generation/types'

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

export function updateRequestPosterActivityMode(
  request: GenerationTaskRequest,
  activityMode: PosterActivityMode
): GenerationTaskRequest {
  return {
    ...request,
    outputs: {
      ...request.outputs,
      poster: {
        ...request.outputs.poster,
        activityMode,
      },
    },
  }
}

export function updateRequestPosterRideId(
  request: GenerationTaskRequest,
  selectedRideId: number | null
): GenerationTaskRequest {
  return {
    ...request,
    outputs: {
      ...request.outputs,
      poster: {
        ...request.outputs.poster,
        selectedRideId,
      },
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
