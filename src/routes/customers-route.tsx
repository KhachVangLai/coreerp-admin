import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  CustomerTypeBadge,
  EntityStatusBadge,
} from '@/components/master-data/entity-badges'
import {
  DialogActions,
  DialogFrame,
  FeedbackMessage,
  FieldError,
  FormField,
  PaginationControls,
  ResourceErrorState,
  TableCard,
  TableColumnHeader,
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
  createCustomer,
  listCustomers,
  updateCustomer,
} from '@/features/master-data/master-data-api'
import { normalizeApiError, type BackendError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import type {
  CreateCustomerPayload,
  Customer,
  CustomerStatus,
  CustomerType,
  ListCustomersParams,
  UpdateCustomerPayload,
} from '@/types/master-data'
import { customerTypes, entityStatuses } from '@/types/master-data'

const defaultLimit = 20
const allTypesValue = 'ALL_TYPES'
const allStatusesValue = 'ALL_STATUSES'

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, {
    message: 'Enter a valid email.',
  })

const createCustomerSchema = z.object({
  code: z.string().min(1, 'Code is required.'),
  name: z.string().min(1, 'Name is required.'),
  phone: z.string().trim(),
  email: optionalEmail,
  taxCode: z.string().trim(),
  type: z.enum(customerTypes),
})

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  phone: z.string().trim(),
  email: optionalEmail,
  taxCode: z.string().trim(),
  type: z.enum(customerTypes),
  status: z.enum(entityStatuses),
})

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>
type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>

type CustomerFilters = {
  page: number
  limit: number
  q: string
  type: CustomerType | ''
  status: CustomerStatus | ''
}

export function CustomersRoute() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: defaultLimit,
    q: '',
    type: '',
    status: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const canWrite =
    auth.user?.role === 'TENANT_ADMIN' || auth.user?.role === 'SALES'

  const customersQuery = useQuery({
    queryKey: ['customers', filters],
    queryFn: () => listCustomers(toListParams(filters)),
  })

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async () => {
      setFeedback('Customer created successfully.')
      setIsCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateCustomerPayload
    }) => updateCustomer(id, payload),
    onSuccess: async () => {
      setFeedback('Customer updated successfully.')
      setEditingCustomer(null)
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  const listError = customersQuery.error
    ? normalizeApiError(customersQuery.error)
    : undefined
  const customers = customersQuery.data?.data ?? []

  function applyFilters(nextFilters: Partial<CustomerFilters>) {
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
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500">
            Manage customer master data and customer status
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
            Create Customer
          </Button>
        ) : null}
      </div>

      <FeedbackMessage message={feedback} />

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_180px_auto]"
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
              placeholder="Search code, name, phone, or email"
              aria-label="Search customers"
            />
          </div>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={filters.type || allTypesValue}
            onChange={(event) =>
              applyFilters({
                type:
                  event.target.value === allTypesValue
                    ? ''
                    : (event.target.value as CustomerType),
              })
            }
            aria-label="Filter by customer type"
          >
            <option value={allTypesValue}>All types</option>
            {customerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={filters.status || allStatusesValue}
            onChange={(event) =>
              applyFilters({
                status:
                  event.target.value === allStatusesValue
                    ? ''
                    : (event.target.value as CustomerStatus),
              })
            }
            aria-label="Filter by status"
          >
            <option value={allStatusesValue}>All statuses</option>
            {entityStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <TableCard>
        {customersQuery.isLoading ? (
          <TableState>Loading customers...</TableState>
        ) : listError ? (
          <ResourceErrorState error={listError} />
        ) : customers.length === 0 ? (
          <TableState>No customers match the current filters.</TableState>
        ) : (
          <CustomersTable
            canWrite={canWrite}
            customers={customers}
            onEdit={(customer) => {
              updateMutation.reset()
              setEditingCustomer(customer)
            }}
          />
        )}
        <TablePagination>
          <PaginationControls
            isFetching={customersQuery.isFetching}
            meta={customersQuery.data?.meta}
            page={filters.page}
            totalLabel="customers"
            onPageChange={(page) => applyFilters({ page })}
          />
        </TablePagination>
      </TableCard>

      {isCreateOpen ? (
        <CreateCustomerDialog
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

      {editingCustomer ? (
        <UpdateCustomerDialog
          customer={editingCustomer}
          error={
            updateMutation.error
              ? normalizeApiError(updateMutation.error)
              : undefined
          }
          isSubmitting={updateMutation.isPending}
          onClose={() => {
            updateMutation.reset()
            setEditingCustomer(null)
          }}
          onSubmit={(payload) =>
            updateMutation.mutate({ id: editingCustomer.id, payload })
          }
        />
      ) : null}
    </section>
  )
}

function toListParams(filters: CustomerFilters): ListCustomersParams {
  return {
    page: filters.page,
    limit: filters.limit,
    q: filters.q || undefined,
    type: filters.type || undefined,
    status: filters.status || undefined,
  }
}

function CustomersTable({
  canWrite,
  customers,
  onEdit,
}: {
  canWrite: boolean
  customers: Customer[]
  onEdit: (customer: Customer) => void
}) {
  return (
    <TableScroll>
      <table className={`${tableClassName} min-w-[1040px]`}>
        <thead className={tableHeaderClassName}>
          <tr>
            <th className={tableKeyHeaderCellClassName}>
              <TableColumnHeader
                label="Code"
              />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Name" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Phone" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Email" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Type" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Status" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Created at" />
            </th>
            {canWrite ? (
              <th className={tableActionHeaderCellClassName}>
                <TableColumnHeader align="right" label="Actions" />
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className={tableBodyClassName}>
          {customers.map((customer) => (
            <tr key={customer.id} className="group hover:bg-slate-50">
              <td className={`${tableKeyCellClassName} font-medium text-slate-900`}>
                <TruncatedCellText maxWidth="max-w-[140px]" title={customer.code}>
                  {customer.code}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} text-slate-700`}>
                <TruncatedCellText maxWidth="max-w-[240px]" title={customer.name}>
                  {customer.name}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-slate-600`}>
                {customer.phone || '-'}
              </td>
              <td className={`${tableCellClassName} text-slate-600`}>
                <TruncatedCellText maxWidth="max-w-[240px]" title={customer.email ?? undefined}>
                  {customer.email || '-'}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap`}>
                <CustomerTypeBadge type={customer.type} />
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap`}>
                <EntityStatusBadge status={customer.status} />
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-slate-600`}>
                {formatDate(customer.createdAt)}
              </td>
              {canWrite ? (
                <td className={tableActionCellClassName}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(customer)}
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

function CreateCustomerDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: CreateCustomerPayload) => void
}) {
  const form = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      code: '',
      name: '',
      phone: '',
      email: '',
      taxCode: '',
      type: 'B2C',
    },
  })

  return (
    <DialogFrame title="Create Customer" onClose={onClose}>
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
        <FormField label="Phone" error={form.formState.errors.phone?.message}>
          <Input disabled={isSubmitting} {...form.register('phone')} />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" disabled={isSubmitting} {...form.register('email')} />
        </FormField>
        <FormField label="Tax code" error={form.formState.errors.taxCode?.message}>
          <Input disabled={isSubmitting} {...form.register('taxCode')} />
        </FormField>
        <FormField label="Type" error={form.formState.errors.type?.message}>
          <select
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            disabled={isSubmitting}
            {...form.register('type')}
          >
            {customerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>
        <DialogActions
          submitLabel={isSubmitting ? 'Creating...' : 'Create customer'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

function UpdateCustomerDialog({
  customer,
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  customer: Customer
  error?: BackendError
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: UpdateCustomerPayload) => void
}) {
  const form = useForm<UpdateCustomerFormValues>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      taxCode: customer.taxCode ?? '',
      type: customer.type,
      status: customer.status,
    },
  })

  return (
    <DialogFrame title={`Edit ${customer.code}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit(toUpdatePayload(values)))}
      >
        <FieldError error={error} />
        <FormField label="Name" error={form.formState.errors.name?.message}>
          <Input disabled={isSubmitting} {...form.register('name')} />
        </FormField>
        <FormField label="Phone" error={form.formState.errors.phone?.message}>
          <Input disabled={isSubmitting} {...form.register('phone')} />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" disabled={isSubmitting} {...form.register('email')} />
        </FormField>
        <FormField label="Tax code" error={form.formState.errors.taxCode?.message}>
          <Input disabled={isSubmitting} {...form.register('taxCode')} />
        </FormField>
        <FormField label="Type" error={form.formState.errors.type?.message}>
          <select
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            disabled={isSubmitting}
            {...form.register('type')}
          >
            {customerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status" error={form.formState.errors.status?.message}>
          <select
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            disabled={isSubmitting}
            {...form.register('status')}
          >
            {entityStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
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

function toCreatePayload(values: CreateCustomerFormValues): CreateCustomerPayload {
  return {
    code: values.code,
    name: values.name,
    phone: emptyToNull(values.phone),
    email: emptyToNull(values.email),
    taxCode: emptyToNull(values.taxCode),
    type: values.type,
  }
}

function toUpdatePayload(values: UpdateCustomerFormValues): UpdateCustomerPayload {
  return {
    name: values.name,
    phone: emptyToNull(values.phone),
    email: emptyToNull(values.email),
    taxCode: emptyToNull(values.taxCode),
    type: values.type,
    status: values.status,
  }
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
