import { apiClient } from '@/lib/api-client'
import type {
  ApiDataResponse,
  AuthUser,
  LoginPayload,
  LoginResult,
} from '@/types/auth'

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<ApiDataResponse<LoginResult>>(
    '/auth/login',
    payload,
  )

  return response.data.data
}

export async function getCurrentUser() {
  const response = await apiClient.get<ApiDataResponse<AuthUser>>('/me')

  return response.data.data
}
