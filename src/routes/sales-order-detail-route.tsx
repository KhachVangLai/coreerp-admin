import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, CheckCircle2, PackageCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'

import {
  DialogActions,
  DialogFrame,
  FormField,
  ResourceErrorState,
} from '@/components/master-data/master-data-ui'
import { SalesOrderStatusBadge } from '@/components/sales-orders/sales-order-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import {
  cancelSalesOrder,
  confirmSalesOrder,
  fulfillSalesOrder,
  getSalesOrder,
} from '@/features/sales-orders/sales-orders-api'
import { normalizeApiError, type BackendError } from '@/lib/api-error'
import { formatDate, formatMoney } from '@/lib/format'
import {
  formatSalesOrderCustomer,
  formatSalesOrderWarehouse,
} from '@/lib/sales-order-format'
import type {
  CancelSalesOrderPayload,
  FulfillSalesOrderPayload,
  SalesOrder,
  SalesOrderLine,
  SalesOrderReservation,
} from '@/types/sales-orders'

const cancelSchema = z.object({
  reason: z.string().min(1, 'Reason is required.'),
})

const fulfillSchema = z.object({
  note: z.string().trim(),
})

type CancelFormValues = z.infer<typeof cancelSchema>
type FulfillFormValues = z.infer<typeof fulfillSchema>
type ActionDialog = 'cancel' | 'fulfill' | null

export function SalesOrderDetailRoute() {
  const { id } = useParams()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [actionDialog, setActionDialog] = useState<ActionDialog>(null)
  const canSalesAction =
    auth.user?.role === 'TENANT_ADMIN' || auth.user?.role === 'SALES'
  const canFulfill =
    auth.user?.role === 'TENANT_ADMIN' || auth.user?.role === 'WAREHOUSE'

  const orderQuery = useQuery({
    queryKey: ['sales-order', id],
    queryFn: () => getSalesOrder(id ?? ''),
    enabled: Boolean(id),
  })

  const confirmMutation = useMutation({
    mutationFn: () => confirmSalesOrder(id ?? ''),
    onSuccess: async () => {
      await invalidateSalesOrderQueries(queryClient, id)
    },
  })
  const cancelMutation = useMutation({
    mutationFn: (payload: CancelSalesOrderPayload) =>
      cancelSalesOrder(id ?? '', payload),
    onSuccess: async () => {
      setActionDialog(null)
      await invalidateSalesOrderQueries(queryClient, id)
    },
  })
  const fulfillMutation = useMutation({
    mutationFn: (payload: FulfillSalesOrderPayload) =>
      fulfillSalesOrder(id ?? '', payload),
    onSuccess: async () => {
      setActionDialog(null)
      await invalidateSalesOrderQueries(queryClient, id)
    },
  })

  if (orderQuery.isLoading) {
    return <div className="text-sm text-slate-600">Loading sales order...</div>
  }

  if (orderQuery.error) {
    return <ResourceErrorState error={normalizeApiError(orderQuery.error)} />
  }

  if (!orderQuery.data) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Sales order not found.
      </div>
    )
  }

  const order = orderQuery.data
  const canConfirm = canSalesAction && order.status === 'DRAFT'
  const canCancel =
    canSalesAction && (order.status === 'DRAFT' || order.status === 'CONFIRMED')
  const canFulfillOrder = canFulfill && order.status === 'CONFIRMED'

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {order.orderCode}
            </h1>
            <SalesOrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-slate-500">
            Confirm reserves stock. Fulfill posts stock out. Cancel confirmed
            orders releases reservation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canConfirm ? (
            <Button
              disabled={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate()}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm'}
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              variant="outline"
              onClick={() => {
                cancelMutation.reset()
                setActionDialog('cancel')
              }}
            >
              <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          ) : null}
          {canFulfillOrder ? (
            <Button
              variant="outline"
              onClick={() => {
                fulfillMutation.reset()
                setActionDialog('fulfill')
              }}
            >
              <PackageCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Fulfill
            </Button>
          ) : null}
        </div>
      </div>

      <ActionError
        error={
          confirmMutation.error
            ? normalizeApiError(confirmMutation.error)
            : undefined
        }
      />

      <OrderHeaderCard order={order} />
      <LinesTable lines={order.lines ?? []} />
      <ReservationsSection reservations={order.reservations ?? []} />
      {order.invoice ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          Invoice summary is available from the backend. Invoice page behavior
          will be implemented in a later task.
        </div>
      ) : null}

      {actionDialog === 'cancel' ? (
        <CancelDialog
          error={
            cancelMutation.error ? normalizeApiError(cancelMutation.error) : undefined
          }
          isSubmitting={cancelMutation.isPending}
          onClose={() => setActionDialog(null)}
          onSubmit={(payload) => cancelMutation.mutate(payload)}
        />
      ) : null}

      {actionDialog === 'fulfill' ? (
        <FulfillDialog
          error={
            fulfillMutation.error
              ? normalizeApiError(fulfillMutation.error)
              : undefined
          }
          isSubmitting={fulfillMutation.isPending}
          onClose={() => setActionDialog(null)}
          onSubmit={(payload) => fulfillMutation.mutate(payload)}
        />
      ) : null}
    </section>
  )
}

async function invalidateSalesOrderQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string | undefined,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
    queryClient.invalidateQueries({ queryKey: ['sales-order', id] }),
  ])
}

function OrderHeaderCard({ order }: { order: SalesOrder }) {
  const subtotal = order.subtotalAmount ?? order.subtotal

  return (
    <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-4">
      <InfoBlock label="Customer" value={formatSalesOrderCustomer(order)} />
      <InfoBlock label="Warehouse" value={formatSalesOrderWarehouse(order)} />
      <InfoBlock label="Subtotal" value={formatMoney(subtotal)} />
      <InfoBlock label="Total" value={formatMoney(order.totalAmount)} />
      <InfoBlock label="Discount" value={formatMoney(order.discountAmount)} />
      <InfoBlock label="Tax" value={formatMoney(order.taxAmount)} />
      <InfoBlock label="Created" value={formatDate(order.createdAt)} />
      <InfoBlock label="Confirmed" value={formatOptionalDate(order.confirmedAt)} />
      <InfoBlock label="Fulfilled" value={formatOptionalDate(order.fulfilledAt)} />
      <InfoBlock label="Completed" value={formatOptionalDate(order.completedAt)} />
      <InfoBlock label="Cancelled" value={formatOptionalDate(order.cancelledAt)} />
      <div className="lg:col-span-4">
        <p className="text-xs font-medium uppercase text-slate-500">Note</p>
        <p className="mt-1 text-sm text-slate-700">{order.note || '-'}</p>
      </div>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function LinesTable({ lines }: { lines: SalesOrderLine[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Order lines</h2>
      </div>
      {lines.length === 0 ? (
        <div className="p-6 text-sm text-slate-600">No order lines returned.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {lines.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                    {line.skuSnapshot ?? line.sku ?? line.productId}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {line.productNameSnapshot ?? line.productName ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {line.unitSnapshot ?? line.unit ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {line.quantity}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {formatMoney(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ReservationsSection({
  reservations,
}: {
  reservations: SalesOrderReservation[]
}) {
  if (reservations.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Reservations</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Warehouse</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {reservations.map((reservation) => (
              <tr key={reservation.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {reservation.sku
                    ? `${reservation.sku} - ${reservation.productName ?? ''}`
                    : reservation.productId}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {reservation.warehouseCode
                    ? `${reservation.warehouseCode} - ${
                        reservation.warehouseName ?? ''
                      }`
                    : reservation.warehouseId}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {reservation.quantity}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {reservation.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CancelDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: CancelSalesOrderPayload) => void
}) {
  const form = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  })

  return (
    <DialogFrame
      title="Cancel Sales Order"
      description="Cancelling a confirmed order releases stock reservation."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <ActionError error={error} />
        <FormField label="Reason" error={form.formState.errors.reason?.message}>
          <Input disabled={isSubmitting} {...form.register('reason')} />
        </FormField>
        <DialogActions
          submitLabel={isSubmitting ? 'Cancelling...' : 'Cancel order'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

function FulfillDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: FulfillSalesOrderPayload) => void
}) {
  const form = useForm<FulfillFormValues>({
    resolver: zodResolver(fulfillSchema),
    defaultValues: { note: '' },
  })

  return (
    <DialogFrame
      title="Fulfill Sales Order"
      description="Fulfillment posts stock OUT for this confirmed order."
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          onSubmit({ note: values.note.trim() === '' ? null : values.note }),
        )}
      >
        <ActionError error={error} />
        <FormField label="Note" error={form.formState.errors.note?.message}>
          <Input disabled={isSubmitting} {...form.register('note')} />
        </FormField>
        <DialogActions
          submitLabel={isSubmitting ? 'Fulfilling...' : 'Fulfill order'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

function ActionError({ error }: { error?: BackendError }) {
  if (!error) {
    return null
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {error.code ? <p className="font-medium">{error.code}</p> : null}
      <p>{friendlyErrorMessage(error)}</p>
      {error.code === 'INSUFFICIENT_STOCK' && error.details ? (
        <pre className="mt-2 whitespace-pre-wrap rounded bg-white/70 p-2 text-xs">
          {JSON.stringify(error.details, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}

function friendlyErrorMessage(error: BackendError) {
  if (error.code === 'INSUFFICIENT_STOCK') {
    return 'Insufficient stock to confirm this order. Check requested and available quantities, then adjust the order or receive stock.'
  }

  if (error.code === 'INVALID_ORDER_STATUS') {
    return 'This action is not valid for the current order status.'
  }

  if (error.code === 'NOT_FOUND') {
    return 'The sales order or one of its related records was not found.'
  }

  if (error.code === 'FORBIDDEN') {
    return 'You do not have permission to perform this action.'
  }

  return error.message
}

function formatOptionalDate(value: string | null | undefined) {
  return value ? formatDate(value) : '-'
}
