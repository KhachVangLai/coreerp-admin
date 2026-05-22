import { useQuery } from '@tanstack/react-query'
import { Eye, Search, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AuditActionBadge } from '@/components/audit-logs/audit-log-badges'
import {
  DialogFrame,
  PaginationControls,
  ResourceErrorState,
} from '@/components/master-data/master-data-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import { listAuditLogs } from '@/features/audit-logs/audit-logs-api'
import { normalizeApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import type { AuditLog, AuditLogMetadata, ListAuditLogsParams } from '@/types/audit-logs'

const defaultLimit = 20
const redactedValue = '[REDACTED]'
const sensitiveKeyPattern = /password|passwordhash|token|secret/i

type AuditLogFilters = {
  page: number
  limit: number
  action: string
  entityType: string
  entityId: string
  actorUserId: string
}

export function AuditLogsRoute() {
  const auth = useAuth()
  const isTenantAdmin = auth.user?.role === 'TENANT_ADMIN'
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: defaultLimit,
    action: '',
    entityType: '',
    entityId: '',
    actorUserId: '',
  })
  const [draftFilters, setDraftFilters] = useState({
    action: '',
    entityType: '',
    entityId: '',
    actorUserId: '',
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => listAuditLogs(toListParams(filters)),
    enabled: isTenantAdmin,
  })

  if (!isTenantAdmin) {
    return <ForbiddenAuditLogsState />
  }

  const error = auditLogsQuery.error
    ? normalizeApiError(auditLogsQuery.error)
    : undefined
  const auditLogs = auditLogsQuery.data?.data ?? []

  function applyFilters(nextFilters: Partial<AuditLogFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1,
    }))
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-slate-500">
          Review tenant-scoped business actions and user activity.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_180px_220px_220px_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            applyFilters({
              action: draftFilters.action.trim(),
              entityType: draftFilters.entityType.trim(),
              entityId: draftFilters.entityId.trim(),
              actorUserId: draftFilters.actorUserId.trim(),
            })
          }}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={draftFilters.action}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  action: event.target.value,
                }))
              }
              className="pl-9"
              placeholder="Action"
              aria-label="Filter by action"
            />
          </div>
          <Input
            value={draftFilters.entityType}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                entityType: event.target.value,
              }))
            }
            placeholder="Entity type"
            aria-label="Filter by entity type"
          />
          <Input
            value={draftFilters.entityId}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                entityId: event.target.value,
              }))
            }
            placeholder="Entity ID"
            aria-label="Filter by entity ID"
          />
          <Input
            value={draftFilters.actorUserId}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                actorUserId: event.target.value,
              }))
            }
            placeholder="Actor user ID"
            aria-label="Filter by actor user ID"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {auditLogsQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading audit logs...</div>
        ) : error ? (
          error.code === 'FORBIDDEN' ? (
            <ForbiddenAuditLogsState />
          ) : (
            <ResourceErrorState error={error} />
          )
        ) : auditLogs.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No audit logs match the current filters.
          </div>
        ) : (
          <AuditLogsTable auditLogs={auditLogs} onViewDetails={setSelectedLog} />
        )}
      </div>

      <PaginationControls
        isFetching={auditLogsQuery.isFetching}
        meta={auditLogsQuery.data?.meta}
        page={filters.page}
        totalLabel="audit logs"
        onPageChange={(page) => applyFilters({ page })}
      />

      {selectedLog ? (
        <AuditLogDetailsDialog
          auditLog={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      ) : null}
    </section>
  )
}

function toListParams(filters: AuditLogFilters): ListAuditLogsParams {
  return {
    page: filters.page,
    limit: filters.limit,
    action: filters.action || undefined,
    entityType: filters.entityType || undefined,
    entityId: filters.entityId || undefined,
    actorUserId: filters.actorUserId || undefined,
  }
}

function AuditLogsTable({
  auditLogs,
  onViewDetails,
}: {
  auditLogs: AuditLog[]
  onViewDetails: (auditLog: AuditLog) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Created At</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Entity Type</th>
            <th className="px-4 py-3">Entity ID</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Metadata</th>
            <th className="px-4 py-3 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {auditLogs.map((auditLog) => (
            <tr key={auditLog.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(auditLog.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AuditActionBadge action={auditLog.action} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {auditLog.entityType ?? '-'}
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-slate-600">
                {auditLog.entityId ?? '-'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {auditLog.actorEmail ?? auditLog.actorUserId ?? 'System'}
              </td>
              <td className="max-w-[280px] truncate px-4 py-3 text-slate-600">
                {metadataSummary(auditLog.metadata)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(auditLog)}
                >
                  <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AuditLogDetailsDialog({
  auditLog,
  onClose,
}: {
  auditLog: AuditLog
  onClose: () => void
}) {
  const metadataJson = useMemo(
    () => JSON.stringify(sanitizeMetadata(auditLog.metadata), null, 2),
    [auditLog.metadata],
  )

  return (
    <DialogFrame
      title="Audit Log Details"
      description="Read-only event metadata for this tenant action."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2">
          <DetailItem label="Action" value={auditLog.action} />
          <DetailItem label="Created at" value={formatDate(auditLog.createdAt)} />
          <DetailItem label="Entity type" value={auditLog.entityType ?? '-'} />
          <DetailItem label="Entity ID" value={auditLog.entityId ?? '-'} />
          <DetailItem label="Actor" value={auditLog.actorEmail ?? 'System'} />
          <DetailItem label="Actor user ID" value={auditLog.actorUserId ?? '-'} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Metadata</h3>
          <pre className="max-h-96 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {metadataJson}
          </pre>
        </div>
      </div>
    </DialogFrame>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-all text-slate-900">{value}</p>
    </div>
  )
}

function metadataSummary(metadata: AuditLogMetadata) {
  const sanitized = sanitizeMetadata(metadata)

  if (sanitized === null || sanitized === undefined) {
    return 'No metadata'
  }

  if (Array.isArray(sanitized)) {
    return sanitized.length === 0 ? 'Empty array' : `${sanitized.length} items`
  }

  if (typeof sanitized === 'object') {
    const entries = Object.entries(sanitized)

    if (entries.length === 0) {
      return 'Empty object'
    }

    return entries
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${summarizeValue(value)}`)
      .join(', ')
  }

  return summarizeValue(sanitized)
}

function summarizeValue(value: unknown) {
  if (value === null || value === undefined) {
    return '-'
  }

  if (Array.isArray(value)) {
    return `[${value.length}]`
  }

  if (typeof value === 'object') {
    return '{...}'
  }

  const text = String(value)

  return text.length > 48 ? `${text.slice(0, 45)}...` : text
}

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveKeyPattern.test(key) ? redactedValue : sanitizeMetadata(nestedValue),
      ]),
    )
  }

  return value
}

function ForbiddenAuditLogsState() {
  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="mt-1 text-sm">
            Audit Logs are available only to tenant administrators.
          </p>
        </div>
      </div>
    </section>
  )
}
