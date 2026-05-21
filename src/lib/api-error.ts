import axios from 'axios'

export type BackendError = {
  code?: string
  message: string
  details?: unknown
}

type BackendErrorResponse = {
  error?: BackendError
}

export function normalizeApiError(error: unknown): BackendError {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    const backendError = error.response?.data?.error

    if (backendError?.message) {
      return {
        code: backendError.code,
        message: backendError.message,
        details: backendError.details,
      }
    }

    if (error.message) {
      return {
        code: error.code,
        message: error.message,
      }
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  return {
    message: 'An unexpected error occurred.',
  }
}
