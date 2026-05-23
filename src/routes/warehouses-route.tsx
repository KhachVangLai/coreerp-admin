import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ActiveBadge } from '@/components/master-data/entity-badges'
import {
  DialogActions,
  DialogFrame,
  FeedbackMessage,
  FieldError,
  FormField,
  PaginationControls,
  ResourceErrorState,
  TableCard,
  TablePagination,
  TableScroll,
  TableState,
  TruncatedCellText,
  tableActionCellClassName,
  tableActionHeaderCellClassName,
  tableBodyClassName,
  tableCellClassName,
  tableClassName,
  tableHeaderCellClassName,
  tableHeaderClassName,
  tableKeyCellClassName,
  tableKeyHeaderCellClassName,
} from '@/components/master-data/master-data-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import {
  createWarehouse,
  listWarehouses,
  updateWarehouse,
} from '@/features/master-data/master-data-api'
import { normalizeApiError, type BackendError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import type {
  CreateWarehousePayload,
  ListWarehousesParams,
  UpdateWarehousePayload,
  Warehouse,
} from '@/types/master-data'

const defaultLimit = 20
const allActiveValue = 'ALL_ACTIVE'

const createWarehouseSchema = z.object({
  code: z.string().min(1, 'Code is required.'),
  name: z.string().min(1, 'Name is required.'),
  address: z.string().trim(),
})

const updateWarehouseSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  address: z.string().trim(),
  isActive: z.enum(['true', 'false']),
})

type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>
type UpdateWarehouseFormValues = z.infer<typeof updateWarehouseSchema>

type WarehouseFilters = {
  page: number
  limit: number
  q: string
  isActive: boolean | ''
}

export function WarehousesRoute() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<WarehouseFilters>({
    page: 1,
    limit: defaultLimit,
    q: '',
    isActive: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const canWrite = auth.user?.role === 'TENANT_ADMIN'

  const warehousesQuery = useQuery({
    queryKey: ['warehouses', filters],
    queryFn: () => listWarehouses(toListParams(filters)),
  })

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: async () => {
      setFeedback('Warehouse created successfully.')
      setIsCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateWarehousePayload
    }) => updateWarehouse(id, payload),
    onSuccess: async () => {
      setFeedback('Warehouse updated successfully.')
      setEditingWarehouse(null)
      await queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })

  const listError = warehousesQuery.error
    ? normalizeApiError(warehousesQuery.error)
    : undefined
  const warehouses = warehousesQuery.data?.data ?? []

  function applyFilters(nextFilters: Partial<WarehouseFilters>) {
    setFeedback(null)
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1,
    }))
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
          <p className="text-sm text-slate-500">
            Manage warehouse master data and availability
          </p>
        </div>
        {canWrite ? (
          <Button
            onClick={() => {
              createMutation.reset()
              setIsCreateOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create Warehouse
          </Button>
        ) : null}
      </div>

      <FeedbackMessage message={feedback} />

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            applyFilters({ q: searchValue.trim() })
          }}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="pl-9"
              placeholder="Search code, name, or address"
              aria-label="Search warehouses"
            />
          </div>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={
              filters.isActive === ''
                ? allActiveValue
                : filters.isActive
                  ? 'true'
                  : 'false'
            }
            onChange={(event) =>
              applyFilters({
                isActive:
                  event.target.value === allActiveValue
                    ? ''
                    : event.target.value === 'true',
              })
            }
            aria-label="Filter by active state"
          >
            <option value={allActiveValue}>All states</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <TableCard>
        {warehousesQuery.isLoading ? (
          <TableState>Loading warehouses...</TableState>
        ) : listError ? (
          <ResourceErrorState error={listError} />
        ) : warehouses.length === 0 ? (
          <TableState>No warehouses match the current filters.</TableState>
        ) : (
          <WarehousesTable
            canWrite={canWrite}
            warehouses={warehouses}
            onEdit={(warehouse) => {
              updateMutation.reset()
              setEditingWarehouse(warehouse)
            }}
          />
        )}
        <TablePagination>
          <PaginationControls
            isFetching={warehousesQuery.isFetching}
            meta={warehousesQuery.data?.meta}
            page={filters.page}
            totalLabel="warehouses"
            onPageChange={(page) => applyFilters({ page })}
          />
        </TablePagination>
      </TableCard>

      {isCreateOpen ? (
        <CreateWarehouseDialog
          error={
            createMutation.error
              ? normalizeApiError(createMutation.error)
              : undefined
          }
          isSubmitting={createMutation.isPending}
          onClose={() => {
            createMutation.reset()
            setIsCreateOpen(false)
          }}
          onSubmit={(payload) => createMutation.mutate(payload)}
        />
      ) : null}

      {editingWarehouse ? (
        <UpdateWarehouseDialog
          error={
            updateMutation.error
              ? normalizeApiError(updateMutation.error)
              : undefined
          }
          isSubmitting={updateMutation.isPending}
          warehouse={editingWarehouse}
          onClose={() => {
            updateMutation.reset()
            setEditingWarehouse(null)
          }}
          onSubmit={(payload) =>
            updateMutation.mutate({ id: editingWarehouse.id, payload })
          }
        />
      ) : null}
    </section>
  )
}

function toListParams(filters: WarehouseFilters): ListWarehousesParams {
  return {
    page: filters.page,
    limit: filters.limit,
    q: filters.q || undefined,
    isActive: filters.isActive === '' ? undefined : filters.isActive,
  }
}

function WarehousesTable({
  canWrite,
  warehouses,
  onEdit,
}: {
  canWrite: boolean
  warehouses: Warehouse[]
  onEdit: (warehouse: Warehouse) => void
}) {
  return (
    <TableScroll>
      <table className={`${tableClassName} min-w-[900px]`}>
        <thead className={tableHeaderClassName}>
          <tr>
            <th className={tableKeyHeaderCellClassName}>Code</th>
            <th className={tableHeaderCellClassName}>Name</th>
            <th className={tableHeaderCellClassName}>Address</th>
            <th className={tableHeaderCellClassName}>Active</th>
            <th className={tableHeaderCellClassName}>Created at</th>
            {canWrite ? (
              <th className={tableActionHeaderCellClassName}>Actions</th>
            ) : null}
          </tr>
        </thead>
        <tbody className={tableBodyClassName}>
          {warehouses.map((warehouse) => (
            <tr key={warehouse.id} className="group hover:bg-slate-50">
              <td className={`${tableKeyCellClassName} font-medium text-slate-900`}>
                <TruncatedCellText maxWidth="max-w-[140px]" title={warehouse.code}>
                  {warehouse.code}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} text-slate-700`}>
                <TruncatedCellText maxWidth="max-w-[240px]" title={warehouse.name}>
                  {warehouse.name}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} text-slate-600`}>
                <TruncatedCellText
                  maxWidth="max-w-[300px]"
                  title={warehouse.address ?? undefined}
                >
                  {warehouse.address || '-'}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap`}>
                <ActiveBadge isActive={warehouse.isActive} />
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-slate-600`}>
                {formatDate(warehouse.createdAt)}
              </td>
              {canWrite ? (
                <td className={tableActionCellClassName}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(warehouse)}
                  >
                    <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                    Edit
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}

function CreateWarehouseDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: CreateWarehousePayload) => void
}) {
  const form = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      code: '',
      name: '',
      address: '',
    },
  })

  return (
    <DialogFrame title="Create Warehouse" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit(toCreatePayload(values)))}
      >
        <FieldError error={error} />
        <FormField label="Code" error={form.formState.errors.code?.message}>
          <Input disabled={isSubmitting} {...form.register('code')} />
        </FormField>
        <FormField label="Name" error={form.formState.errors.name?.message}>
          <Input disabled={isSubmitting} {...form.register('name')} />
        </FormField>
        <FormField label="Address" error={form.formState.errors.address?.message}>
          <Input disabled={isSubmitting} {...form.register('address')} />
        </FormField>
        <DialogActions
          submitLabel={isSubmitting ? 'Creating...' : 'Create warehouse'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

function UpdateWarehouseDialog({
  error,
  isSubmitting,
  warehouse,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  isSubmitting: boolean
  warehouse: Warehouse
  onClose: () => void
  onSubmit: (payload: UpdateWarehousePayload) => void
}) {
  const form = useForm<UpdateWarehouseFormValues>({
    resolver: zodResolver(updateWarehouseSchema),
    defaultValues: {
      name: warehouse.name,
      address: warehouse.address ?? '',
      isActive: warehouse.isActive ? 'true' : 'false',
    },
  })

  return (
    <DialogFrame title={`Edit ${warehouse.code}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit(toUpdatePayload(values)))}
      >
        <FieldError error={error} />
        <FormField label="Name" error={form.formState.errors.name?.message}>
          <Input disabled={isSubmitting} {...form.register('name')} />
        </FormField>
        <FormField label="Address" error={form.formState.errors.address?.message}>
          <Input disabled={isSubmitting} {...form.register('address')} />
        </FormField>
        <FormField label="Active" error={form.formState.errors.isActive?.message}>
          <select
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            disabled={isSubmitting}
            {...form.register('isActive')}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </FormField>
        <DialogActions
          submitLabel={isSubmitting ? 'Saving...' : 'Save changes'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

function toCreatePayload(
  values: CreateWarehouseFormValues,
): CreateWarehousePayload {
  return {
    code: values.code,
    name: values.name,
    address: emptyToNull(values.address),
  }
}

function toUpdatePayload(
  values: UpdateWarehouseFormValues,
): UpdateWarehousePayload {
  return {
    name: values.name,
    address: emptyToNull(values.address),
    isActive: values.isActive === 'true',
  }
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
