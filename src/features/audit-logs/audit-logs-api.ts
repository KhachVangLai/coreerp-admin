import { apiClient } from '@/lib/api-client'
import type { AuditLogsResponse, ListAuditLogsParams } from '@/types/audit-logs'

export async function listAuditLogs(params: ListAuditLogsParams) {
  const response = await apiClient.get<AuditLogsResponse>('/audit-logs', {
    params: compactParams(params),
  })

  return response.data
}

function compactParams<TParams extends Record<string, unknown>>(params: TParams) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
}
