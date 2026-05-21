import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { EntityStatusBadge } from '@/components/master-data/entity-badges'
import {
  DialogActions,
  DialogFrame,
  FeedbackMessage,
  FieldError,
  FormField,
  PaginationControls,
  ResourceErrorState,
} from '@/components/master-data/master-data-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import {
  createProduct,
  listProducts,
  updateProduct,
} from '@/features/master-data/master-data-api'
import { normalizeApiError, type BackendError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import type {
  CreateProductPayload,
  ListProductsParams,
  Product,
  ProductStatus,
  UpdateProductPayload,
} from '@/types/master-data'
import { entityStatuses } from '@/types/master-data'

const defaultLimit = 20
const allStatusesValue = 'ALL_STATUSES'

const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required.'),
  name: z.string().min(1, 'Name is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  basePrice: z
    .string()
    .min(1, 'Base price is required.')
    .refine((value) => Number(value) >= 0, {
      message: 'Base price must be greater than or equal to 0.',
    }),
})

const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  unit: z.string().min(1, 'Unit is required.'),
  basePrice: z
    .string()
    .min(1, 'Base price is required.')
    .refine((value) => Number(value) >= 0, {
      message: 'Base price must be greater than or equal to 0.',
    }),
  status: z.enum(entityStatuses),
})

type CreateProductFormValues = z.infer<typeof createProductSchema>
type UpdateProductFormValues = z.infer<typeof updateProductSchema>

type ProductFilters = {
  page: number
  limit: number
  q: string
  status: ProductStatus | ''
}

export function ProductsRoute() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: defaultLimit,
    q: '',
    status: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const canWrite = auth.user?.role === 'TENANT_ADMIN'

  const productsQuery = useQuery({
    queryKey: ['products', filters],
    queryFn: () => listProducts(toListParams(filters)),
  })

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      setFeedback('Product created successfully.')
      setIsCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateProductPayload
    }) => updateProduct(id, payload),
    onSuccess: async () => {
      setFeedback('Product updated successfully.')
      setEditingProduct(null)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const listError = productsQuery.error
    ? normalizeApiError(productsQuery.error)
    : undefined
  const products = productsQuery.data?.data ?? []

  function applyFilters(nextFilters: Partial<ProductFilters>) {
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
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-slate-500">
            Manage product catalog and pricing master data
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
            Create Product
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
              placeholder="Search SKU or product name"
              aria-label="Search products"
            />
          </div>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={filters.status || allStatusesValue}
            onChange={(event) =>
              applyFilters({
                status:
                  event.target.value === allStatusesValue
                    ? ''
                    : (event.target.value as ProductStatus),
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

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {productsQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading products...</div>
        ) : listError ? (
          <ResourceErrorState error={listError} />
        ) : products.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No products match the current filters.
          </div>
        ) : (
          <ProductsTable
            canWrite={canWrite}
            products={products}
            onEdit={(product) => {
              updateMutation.reset()
              setEditingProduct(product)
            }}
          />
        )}
      </div>

      <PaginationControls
        isFetching={productsQuery.isFetching}
        meta={productsQuery.data?.meta}
        page={filters.page}
        totalLabel="products"
        onPageChange={(page) => applyFilters({ page })}
      />

      {isCreateOpen ? (
        <CreateProductDialog
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

      {editingProduct ? (
        <UpdateProductDialog
          error={
            updateMutation.error
              ? normalizeApiError(updateMutation.error)
              : undefined
          }
          isSubmitting={updateMutation.isPending}
          product={editingProduct}
          onClose={() => {
            updateMutation.reset()
            setEditingProduct(null)
          }}
          onSubmit={(payload) =>
            updateMutation.mutate({ id: editingProduct.id, payload })
          }
        />
      ) : null}
    </section>
  )
}

function toListParams(filters: ProductFilters): ListProductsParams {
  return {
    page: filters.page,
    limit: filters.limit,
    q: filters.q || undefined,
    status: filters.status || undefined,
  }
}

function ProductsTable({
  canWrite,
  products,
  onEdit,
}: {
  canWrite: boolean
  products: Product[]
  onEdit: (product: Product) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Unit</th>
            <th className="px-4 py-3">Base Price</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created at</th>
            {canWrite ? <th className="px-4 py-3 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {product.sku}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {product.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {product.unit}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatCurrency(product.basePrice)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <EntityStatusBadge status={product.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(product.createdAt)}
              </td>
              {canWrite ? (
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
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
    </div>
  )
}

function CreateProductDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: CreateProductPayload) => void
}) {
  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: '',
      name: '',
      unit: '',
      basePrice: '0',
    },
  })

  return (
    <DialogFrame title="Create Product" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit(toCreatePayload(values)))}
      >
        <FieldError error={error} />
        <FormField label="SKU" error={form.formState.errors.sku?.message}>
          <Input disabled={isSubmitting} {...form.register('sku')} />
        </FormField>
        <FormField label="Name" error={form.formState.errors.name?.message}>
          <Input disabled={isSubmitting} {...form.register('name')} />
        </FormField>
        <FormField label="Unit" error={form.formState.errors.unit?.message}>
          <Input disabled={isSubmitting} {...form.register('unit')} />
        </FormField>
        <FormField label="Base price" error={form.formState.errors.basePrice?.message}>
          <Input
            type="number"
            min="0"
            step="0.01"
            disabled={isSubmitting}
            {...form.register('basePrice')}
          />
        </FormField>
        <DialogActions
          submitLabel={isSubmitting ? 'Creating...' : 'Create product'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

function UpdateProductDialog({
  error,
  isSubmitting,
  product,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  isSubmitting: boolean
  product: Product
  onClose: () => void
  onSubmit: (payload: UpdateProductPayload) => void
}) {
  const form = useForm<UpdateProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      unit: product.unit,
      basePrice: product.basePrice,
      status: product.status,
    },
  })

  return (
    <DialogFrame title={`Edit ${product.sku}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit(toUpdatePayload(values)))}
      >
        <FieldError error={error} />
        <FormField label="Name" error={form.formState.errors.name?.message}>
          <Input disabled={isSubmitting} {...form.register('name')} />
        </FormField>
        <FormField label="Unit" error={form.formState.errors.unit?.message}>
          <Input disabled={isSubmitting} {...form.register('unit')} />
        </FormField>
        <FormField label="Base price" error={form.formState.errors.basePrice?.message}>
          <Input
            type="number"
            min="0"
            step="0.01"
            disabled={isSubmitting}
            {...form.register('basePrice')}
          />
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

function toCreatePayload(values: CreateProductFormValues): CreateProductPayload {
  return {
    sku: values.sku,
    name: values.name,
    unit: values.unit,
    basePrice: values.basePrice,
  }
}

function toUpdatePayload(values: UpdateProductFormValues): UpdateProductPayload {
  return {
    name: values.name,
    unit: values.unit,
    basePrice: values.basePrice,
    status: values.status,
  }
}

function formatCurrency(value: string) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return value
  }

  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(numberValue)
}
