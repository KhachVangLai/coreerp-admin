import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import {
  FieldError,
  FormField,
  ResourceErrorState,
} from '@/components/master-data/master-data-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import {
  listCustomers,
  listProducts,
  listWarehouses,
} from '@/features/master-data/master-data-api'
import { createSalesOrder } from '@/features/sales-orders/sales-orders-api'
import { normalizeApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import type { CreateSalesOrderPayload } from '@/types/sales-orders'

const salesOrderLineSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  quantity: z.string().min(1, 'Quantity is required.').refine((value) => Number(value) > 0, {
    message: 'Quantity must be greater than 0.',
  }),
  unitPrice: z.string().min(1, 'Unit price is required.').refine((value) => Number(value) >= 0, {
    message: 'Unit price must be greater than or equal to 0.',
  }),
})

const salesOrderCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  warehouseId: z.string().min(1, 'Warehouse is required.'),
  discountAmount: z.string().min(1, 'Discount is required.').refine((value) => Number(value) >= 0, {
    message: 'Discount must be greater than or equal to 0.',
  }),
  taxAmount: z.string().min(1, 'Tax is required.').refine((value) => Number(value) >= 0, {
    message: 'Tax must be greater than or equal to 0.',
  }),
  note: z.string().trim(),
  lines: z.array(salesOrderLineSchema).min(1, 'At least one order line is required.'),
})

type SalesOrderCreateFormValues = z.infer<typeof salesOrderCreateSchema>

export function SalesOrderCreateRoute() {
  const auth = useAuth()
  const navigate = useNavigate()
  const canCreate =
    auth.user?.role === 'TENANT_ADMIN' || auth.user?.role === 'SALES'

  const customersQuery = useQuery({
    queryKey: ['sales-order-create-customers'],
    queryFn: () => listCustomers({ page: 1, limit: 100, status: 'ACTIVE' }),
  })
  const productsQuery = useQuery({
    queryKey: ['sales-order-create-products'],
    queryFn: () => listProducts({ page: 1, limit: 100, status: 'ACTIVE' }),
  })
  const warehousesQuery = useQuery({
    queryKey: ['sales-order-create-warehouses'],
    queryFn: () => listWarehouses({ page: 1, limit: 100, isActive: true }),
  })

  const form = useForm<SalesOrderCreateFormValues>({
    resolver: zodResolver(salesOrderCreateSchema),
    defaultValues: {
      customerId: '',
      warehouseId: '',
      discountAmount: '0.00',
      taxAmount: '0.00',
      note: '',
      lines: [{ productId: '', quantity: '1', unitPrice: '0.00' }],
    },
  })
  const fieldArray = useFieldArray({
    control: form.control,
    name: 'lines',
  })
  const watchedLines = useWatch({ control: form.control, name: 'lines' })
  const watchedDiscount = useWatch({
    control: form.control,
    name: 'discountAmount',
  })
  const watchedTax = useWatch({ control: form.control, name: 'taxAmount' })
  const totals = useMemo(
    () => calculateTotals(watchedLines, watchedDiscount, watchedTax),
    [watchedDiscount, watchedLines, watchedTax],
  )

  const createMutation = useMutation({
    mutationFn: createSalesOrder,
    onSuccess: (order) => {
      navigate(`/app/sales-orders/${order.id}`, { replace: true })
    },
  })

  if (!canCreate) {
    return <Navigate to="/app/sales-orders" replace />
  }

  const customers = customersQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []
  const hasMasterData =
    customers.length > 0 && products.length > 0 && warehouses.length > 0

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/app/sales-orders">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Sales Orders
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Sales Order
          </h1>
          <p className="text-sm text-slate-500">
            Draft an order before confirming stock reservation.
          </p>
        </div>
      </div>

      {customersQuery.error ? (
        <ResourceErrorState error={normalizeApiError(customersQuery.error)} />
      ) : null}
      {productsQuery.error ? (
        <ResourceErrorState error={normalizeApiError(productsQuery.error)} />
      ) : null}
      {warehousesQuery.error ? (
        <ResourceErrorState error={normalizeApiError(warehousesQuery.error)} />
      ) : null}

      {!hasMasterData ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Create active customers, products, and warehouses before creating a
          sales order.
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate(toPayload(values)),
          )}
        >
          <FieldError
            error={
              createMutation.error
                ? normalizeApiError(createMutation.error)
                : undefined
            }
          />

          <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-2">
            <FormField
              label="Customer"
              error={form.formState.errors.customerId?.message}
            >
              <select
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                disabled={createMutation.isPending}
                {...form.register('customerId')}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.code} - {customer.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Warehouse"
              error={form.formState.errors.warehouseId?.message}
            >
              <select
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                disabled={createMutation.isPending}
                {...form.register('warehouseId')}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Discount Amount"
              error={form.formState.errors.discountAmount?.message}
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                disabled={createMutation.isPending}
                {...form.register('discountAmount')}
              />
            </FormField>
            <FormField label="Tax Amount" error={form.formState.errors.taxAmount?.message}>
              <Input
                type="number"
                min="0"
                step="0.01"
                disabled={createMutation.isPending}
                {...form.register('taxAmount')}
              />
            </FormField>
            <div className="lg:col-span-2">
              <FormField label="Note" error={form.formState.errors.note?.message}>
                <Input
                  disabled={createMutation.isPending}
                  {...form.register('note')}
                />
              </FormField>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold">Order lines</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  fieldArray.append({
                    productId: '',
                    quantity: '1',
                    unitPrice: '0.00',
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add line
              </Button>
            </div>
            <div className="space-y-3 p-4">
              {fieldArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-md border border-slate-200 p-3 lg:grid-cols-[minmax(220px,1fr)_120px_160px_120px_auto]"
                >
                  <FormField
                    label="Product"
                    error={form.formState.errors.lines?.[index]?.productId?.message}
                  >
                    <select
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      disabled={createMutation.isPending}
                      {...form.register(`lines.${index}.productId`)}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField
                    label="Quantity"
                    error={form.formState.errors.lines?.[index]?.quantity?.message}
                  >
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      disabled={createMutation.isPending}
                      {...form.register(`lines.${index}.quantity`)}
                    />
                  </FormField>
                  <FormField
                    label="Unit Price"
                    error={form.formState.errors.lines?.[index]?.unitPrice?.message}
                  >
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={createMutation.isPending}
                      {...form.register(`lines.${index}.unitPrice`)}
                    />
                  </FormField>
                  <div>
                    <p className="mb-2 text-sm font-medium">Line total</p>
                    <p className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm tabular-nums">
                      {formatMoney(
                        Number(watchedLines?.[index]?.quantity || 0) *
                          Number(watchedLines?.[index]?.unitPrice || 0),
                      )}
                    </p>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={fieldArray.fields.length === 1}
                      onClick={() => fieldArray.remove(index)}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
              {form.formState.errors.lines?.root?.message ? (
                <p className="text-xs text-red-600">
                  {form.formState.errors.lines.root.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Subtotal</p>
                <p className="font-semibold tabular-nums">
                  {formatMoney(totals.subtotal)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Discount + Tax</p>
                <p className="font-semibold tabular-nums">
                  {formatMoney(totals.discount)} / {formatMoney(totals.tax)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Total</p>
                <p className="font-semibold tabular-nums">
                  {formatMoney(totals.total)}
                </p>
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create draft order'}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

function toPayload(values: SalesOrderCreateFormValues): CreateSalesOrderPayload {
  return {
    customerId: values.customerId,
    warehouseId: values.warehouseId,
    discountAmount: values.discountAmount,
    taxAmount: values.taxAmount,
    note: values.note.trim() === '' ? null : values.note.trim(),
    lines: values.lines.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
      unitPrice: line.unitPrice,
    })),
  }
}

function calculateTotals(
  lines: SalesOrderCreateFormValues['lines'] | undefined,
  discountAmount: string,
  taxAmount: string,
) {
  const subtotal =
    lines?.reduce(
      (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0),
      0,
    ) ?? 0
  const discount = Number(discountAmount || 0)
  const tax = Number(taxAmount || 0)

  return {
    subtotal,
    discount,
    tax,
    total: Math.max(subtotal - discount + tax, 0),
  }
}
