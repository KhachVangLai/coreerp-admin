export type UserRole =
  | 'TENANT_ADMIN'
  | 'ADMIN'
  | 'SALES'
  | 'WAREHOUSE'
  | 'FINANCE'
  | 'VIEWER'
  | string

export type UserStatus = 'ACTIVE' | 'INACTIVE' | string

export type AuthUser = {
  id: string
  tenantId: string
  tenantCode: string
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
}

export type LoginPayload = {
  tenantCode: string
  email: string
  password: string
}

export type LoginResult = {
  accessToken: string
  user: AuthUser
}

export type ApiDataResponse<TData> = {
  data: TData
}
