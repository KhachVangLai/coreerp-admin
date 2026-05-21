import { apiClient } from '@/lib/api-client'
import type {
  CreateUserPayload,
  ListUsersParams,
  PaginatedResponse,
  UpdateUserPayload,
  User,
  UserResponse,
} from '@/types/users'

export async function listUsers(params: ListUsersParams) {
  const response = await apiClient.get<PaginatedResponse<User>>('/users', {
    params: compactParams(params),
  })

  return response.data
}

export async function createUser(payload: CreateUserPayload) {
  const response = await apiClient.post<UserResponse>('/users', payload)

  return response.data.data
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const response = await apiClient.patch<UserResponse>(`/users/${id}`, payload)

  return response.data.data
}

function compactParams(params: ListUsersParams) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
}
