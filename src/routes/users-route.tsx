import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Edit, Plus, Search, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { UserRoleBadge, UserStatusBadge } from '@/components/users/user-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createUser, listUsers, updateUser } from '@/features/users/users-api'
import { useAuth } from '@/features/auth/use-auth'
import { normalizeApiError, type BackendError } from '@/lib/api-error'
import type {
  CreateUserPayload,
  ListUsersParams,
  UpdateUserPayload,
  User,
  UserRole,
  UserStatus,
} from '@/types/users'
import { userRoles, userStatuses } from '@/types/users'

const defaultLimit = 20
const allRolesValue = 'ALL_ROLES'
const allStatusesValue = 'ALL_STATUSES'

const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  email: z.string().min(1, 'Email is required.').email('Enter a valid email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(userRoles),
})

const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  role: z.enum(userRoles),
  status: z.enum(userStatuses),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>
type UpdateUserFormValues = z.infer<typeof updateUserSchema>

type UsersFilters = {
  page: number
  limit: number
  q: string
  role: UserRole | ''
  status: UserStatus | ''
}

export function UsersRoute() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<UsersFilters>({
    page: 1,
    limit: defaultLimit,
    q: '',
    role: '',
    status: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const canManageUsers = auth.user?.role === 'TENANT_ADMIN'

  const usersQuery = useQuery({
    queryKey: ['users', filters],
    queryFn: () => listUsers(toListParams(filters)),
    enabled: canManageUsers,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      setFeedback('User created successfully.')
      setIsCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: async () => {
      setFeedback('User updated successfully.')
      setEditingUser(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if (!canManageUsers) {
    return <ForbiddenUsersState />
  }

  const listError = usersQuery.error
    ? normalizeApiError(usersQuery.error)
    : undefined
  const users = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta
  const totalPages = meta?.totalPages ?? 1
  const currentPage = meta?.page ?? filters.page

  function applyFilters(nextFilters: Partial<UsersFilters>) {
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
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-slate-500">Manage tenant users and roles</p>
        </div>
        <Button
          onClick={() => {
            createMutation.reset()
            setIsCreateOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Create User
        </Button>
      </div>

      {feedback ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {feedback}
        </div>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]"
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
              placeholder="Search name or email"
              aria-label="Search users"
            />
          </div>

          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={filters.role || allRolesValue}
            onChange={(event) =>
              applyFilters({
                role:
                  event.target.value === allRolesValue
                    ? ''
                    : (event.target.value as UserRole),
              })
            }
            aria-label="Filter by role"
          >
            <option value={allRolesValue}>All roles</option>
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {role}
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
                    : (event.target.value as UserStatus),
              })
            }
            aria-label="Filter by status"
          >
            <option value={allStatusesValue}>All statuses</option>
            {userStatuses.map((status) => (
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

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {usersQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading users...</div>
        ) : listError ? (
          <UsersErrorState error={listError} />
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No users match the current filters.
          </div>
        ) : (
        <UsersTable
          users={users}
          onEdit={(user) => {
            updateMutation.reset()
            setEditingUser(user)
          }}
        />
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {meta ? `${meta.total} users total` : 'Users total unavailable'}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || usersQuery.isFetching}
            onClick={() => applyFilters({ page: currentPage - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || usersQuery.isFetching}
            onClick={() => applyFilters({ page: currentPage + 1 })}
          >
            Next
          </Button>
        </div>
      </div>

      {isCreateOpen ? (
        <CreateUserDialog
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

      {editingUser ? (
        <UpdateUserDialog
          error={
            updateMutation.error
              ? normalizeApiError(updateMutation.error)
              : undefined
          }
          isSubmitting={updateMutation.isPending}
          user={editingUser}
          onClose={() => {
            updateMutation.reset()
            setEditingUser(null)
          }}
          onSubmit={(payload) =>
            updateMutation.mutate({ id: editingUser.id, payload })
          }
        />
      ) : null}
    </section>
  )
}

function toListParams(filters: UsersFilters): ListUsersParams {
  return {
    page: filters.page,
    limit: filters.limit,
    q: filters.q || undefined,
    role: filters.role || undefined,
    status: filters.status || undefined,
  }
}

type UsersTableProps = {
  users: User[]
  onEdit: (user: User) => void
}

function UsersTable({ users, onEdit }: UsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Full name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created at</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {user.fullName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {user.email}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <UserRoleBadge role={user.role} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <UserStatusBadge status={user.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(user.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                  <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type CreateUserDialogProps = {
  error?: BackendError
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: CreateUserPayload) => void
}

function CreateUserDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateUserDialogProps) {
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'SALES',
    },
  })

  return (
    <DialogFrame title="Create User" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
      >
        <FieldError error={error} />

        <FormField label="Full name" error={form.formState.errors.fullName?.message}>
          <Input disabled={isSubmitting} {...form.register('fullName')} />
        </FormField>

        <FormField label="Email" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            {...form.register('email')}
          />
        </FormField>

        <FormField label="Password" error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            {...form.register('password')}
          />
        </FormField>

        <FormField label="Role" error={form.formState.errors.role?.message}>
          <select
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            disabled={isSubmitting}
            {...form.register('role')}
          >
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </FormField>

        <DialogActions
          submitLabel={isSubmitting ? 'Creating...' : 'Create user'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

type UpdateUserDialogProps = {
  error?: BackendError
  isSubmitting: boolean
  user: User
  onClose: () => void
  onSubmit: (payload: UpdateUserPayload) => void
}

function UpdateUserDialog({
  error,
  isSubmitting,
  user,
  onClose,
  onSubmit,
}: UpdateUserDialogProps) {
  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    },
  })

  return (
    <DialogFrame title={`Edit ${user.email}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
      >
        <FieldError error={error} />

        <FormField label="Full name" error={form.formState.errors.fullName?.message}>
          <Input disabled={isSubmitting} {...form.register('fullName')} />
        </FormField>

        <FormField label="Role" error={form.formState.errors.role?.message}>
          <select
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            disabled={isSubmitting}
            {...form.register('role')}
          >
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {role}
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
            {userStatuses.map((status) => (
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

type DialogFrameProps = {
  children: React.ReactNode
  title: string
  onClose: () => void
}

function DialogFrame({ children, title, onClose }: DialogFrameProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <section className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-slate-500">
              Changes apply only to the current tenant.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </section>
    </div>
  )
}

type DialogActionsProps = {
  isSubmitting: boolean
  submitLabel: string
  onClose: () => void
}

function DialogActions({
  isSubmitting,
  submitLabel,
  onClose,
}: DialogActionsProps) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting}
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </div>
  )
}

type FormFieldProps = {
  children: React.ReactNode
  error?: string
  label: string
}

function FormField({ children, error, label }: FormFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}

type FieldErrorProps = {
  error?: BackendError
}

function FieldError({ error }: FieldErrorProps) {
  if (!error) {
    return null
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {error.code ? <p className="font-medium">{error.code}</p> : null}
      <p>{error.message}</p>
    </div>
  )
}

type UsersErrorStateProps = {
  error: BackendError
}

function UsersErrorState({ error }: UsersErrorStateProps) {
  if (error.code === 'FORBIDDEN') {
    return <ForbiddenUsersState />
  }

  return (
    <div className="flex items-start gap-3 p-6 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
      <div>
        {error.code ? <p className="font-medium">{error.code}</p> : null}
        <p>{error.message}</p>
      </div>
    </div>
  )
}

function ForbiddenUsersState() {
  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="mt-1 text-sm">
            Users Management is available only to tenant administrators.
          </p>
        </div>
      </div>
    </section>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
