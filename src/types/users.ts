import type { ApiDataResponse } from '@/types/auth'

export const userRoles = [
  'TENANT_ADMIN',
  'SALES',
  'WAREHOUSE',
  'FINANCE',
  'VIEWER',
] as const

export const userStatuses = ['ACTIVE', 'INACTIVE'] as const

export type UserRole = (typeof userRoles)[number]
export type UserStatus = (typeof userStatuses)[number]

export type User = {
  id: string
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
  createdAt: string
}

export type ListUsersParams = {
  page?: number
  limit?: number
  q?: string
  role?: UserRole
  status?: UserStatus
}

export type CreateUserPayload = {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export type UpdateUserPayload = {
  fullName?: string
  role?: UserRole
  status?: UserStatus
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<TData> = {
  data: TData[]
  meta: PaginationMeta
}

export type UserResponse = ApiDataResponse<User>
