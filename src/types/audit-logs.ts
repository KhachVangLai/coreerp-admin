import type { PaginatedResponse } from '@/types/api'

export type AuditAction = string

export type AuditLogMetadata =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null

export type AuditLog = {
  id: string
  actorUserId: string | null
  actorEmail: string | null
  action: AuditAction
  entityType: string | null
  entityId: string | null
  metadata: AuditLogMetadata
  createdAt: string
}

export type ListAuditLogsParams = {
  page?: number
  limit?: number
  entityType?: string
  entityId?: string
  actorUserId?: string
  action?: string
}

export type AuditLogsResponse = PaginatedResponse<AuditLog>
