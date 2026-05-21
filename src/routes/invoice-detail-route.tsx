import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Banknote, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'

import {
  InvoiceStatusBadge,
  PaymentMethodBadge,
} from '@/components/finance/finance-badges'
import {
  DialogActions,
  DialogFrame,
  FormField,
  ResourceErrorState,
} from '@/components/master-data/master-data-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import { getInvoice, issueInvoice, recordPayment } from '@/features/finance/finance-api'
import { normalizeApiError, type BackendError } from '@/lib/api-error'
import { formatDate, formatMoney } from '@/lib/format'
import type {
  Invoice,
  InvoiceLine,
  IssueInvoicePayload,
  Payment,
  RecordPaymentPayload,
} from '@/types/finance'
import { paymentMethods } from '@/types/finance'

const issueSchema = z.object({ note: z.string().trim() })
const paymentSchema = z.object({
  amount: z.string().min(1, 'Amount is required.').refine((value) => Number(value) > 0, {
    message: 'Amount must be greater than 0.',
  }),
  method: z.enum(paymentMethods),
  referenceNo: z.string().trim(),
  paidAt: z.string().trim(),
})

type IssueFormValues = z.infer<typeof issueSchema>
type PaymentFormValues = z.infer<typeof paymentSchema>
type DialogKind = 'issue' | 'payment' | null

export function InvoiceDetailRoute() {
  const { id } = useParams()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<DialogKind>(null)
  const canWrite =
    auth.user?.role === 'TENANT_ADMIN' || auth.user?.role === 'FINANCE'

  const invoiceQuery = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id ?? ''),
    enabled: Boolean(id),
  })
  const issueMutation = useMutation({
    mutationFn: (payload: IssueInvoicePayload) => issueInvoice(id ?? '', payload),
    onSuccess: async () => {
      setDialog(null)
      await invalidateInvoiceQueries(queryClient, id)
    },
  })
  const paymentMutation = useMutation({
    mutationFn: (payload: RecordPaymentPayload) =>
      recordPayment(id ?? '', payload),
    onSuccess: async () => {
      setDialog(null)
      await invalidateInvoiceQueries(queryClient, id)
    },
  })

  if (invoiceQuery.isLoading) {
    return <div className="text-sm text-slate-600">Loading invoice...</div>
  }

  if (invoiceQuery.error) {
    return <ResourceErrorState error={normalizeApiError(invoiceQuery.error)} />
  }

  if (!invoiceQuery.data) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Invoice not found.
      </div>
    )
  }

  const invoice = invoiceQuery.data
  const canIssue = canWrite && invoice.status === 'DRAFT'
  const canPay =
    canWrite &&
    (invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID')

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/app/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Invoices
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {invoice.invoiceCode}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canIssue ? (
            <Button onClick={() => setDialog('issue')}>
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              Issue Invoice
            </Button>
          ) : null}
          {canPay ? (
            <Button variant="outline" onClick={() => setDialog('payment')}>
              <Banknote className="mr-2 h-4 w-4" aria-hidden="true" />
              Record Payment
            </Button>
          ) : null}
        </div>
      </div>

      <InvoiceHeader invoice={invoice} />
      <InvoiceLines lines={invoice.lines ?? []} />
      <PaymentsSection payments={invoice.payments ?? []} />

      {dialog === 'issue' ? (
        <IssueDialog
          error={issueMutation.error ? normalizeApiError(issueMutation.error) : undefined}
          isSubmitting={issueMutation.isPending}
          onClose={() => setDialog(null)}
          onSubmit={(payload) => issueMutation.mutate(payload)}
        />
      ) : null}
      {dialog === 'payment' ? (
        <PaymentDialog
          error={
            paymentMutation.error
              ? normalizeApiError(paymentMutation.error)
              : undefined
          }
          invoice={invoice}
          isSubmitting={paymentMutation.isPending}
          onClose={() => setDialog(null)}
          onSubmit={(payload) => paymentMutation.mutate(payload)}
        />
      ) : null}
    </section>
  )
}

async function invalidateInvoiceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string | undefined,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
    queryClient.invalidateQueries({ queryKey: ['invoices'] }),
    queryClient.invalidateQueries({ queryKey: ['payments'] }),
    queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
  ])
}

function InvoiceHeader({ invoice }: { invoice: Invoice }) {
  const subtotal = invoice.subtotalAmount ?? invoice.subtotal
  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount)

  return (
    <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-4">
      <Info label="Sales Order" value={invoice.orderCode ?? invoice.salesOrder?.orderCode ?? invoice.salesOrderId} />
      <Info label="Customer" value={invoice.customerName ?? invoice.customer?.name ?? invoice.customerId ?? '-'} />
      <Info label="Subtotal" value={formatMoney(subtotal)} />
      <Info label="Total" value={formatMoney(invoice.totalAmount)} />
      <Info label="Discount" value={formatMoney(invoice.discountAmount)} />
      <Info label="Tax" value={formatMoney(invoice.taxAmount)} />
      <Info label="Paid" value={formatMoney(invoice.paidAmount)} />
      <Info label="Remaining" value={formatMoney(Math.max(remaining, 0))} />
      <Info label="Issued At" value={invoice.issuedAt ? formatDate(invoice.issuedAt) : '-'} />
      <Info label="Created At" value={formatDate(invoice.createdAt)} />
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function InvoiceLines({ lines }: { lines: InvoiceLine[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Invoice lines</h2>
      </div>
      {lines.length === 0 ? (
        <div className="p-6 text-sm text-slate-600">No invoice lines returned.</div>
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
                <tr key={line.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{line.skuSnapshot ?? line.sku ?? line.productId}</td>
                  <td className="whitespace-nowrap px-4 py-3">{line.productNameSnapshot ?? line.productName ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">{line.unitSnapshot ?? line.unit ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{line.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatMoney(line.unitPrice)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatMoney(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PaymentsSection({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Payments</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Paid At</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference No</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(payment.paidAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatMoney(payment.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3"><PaymentMethodBadge method={payment.method} /></td>
                <td className="whitespace-nowrap px-4 py-3">{payment.referenceNo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IssueDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: IssueInvoicePayload) => void
}) {
  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: { note: '' },
  })

  return (
    <DialogFrame title="Issue Invoice" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          onSubmit({ note: values.note.trim() === '' ? null : values.note }),
        )}
      >
        <FinanceError error={error} />
        <FormField label="Note" error={form.formState.errors.note?.message}>
          <Input disabled={isSubmitting} {...form.register('note')} />
        </FormField>
        <DialogActions
          submitLabel={isSubmitting ? 'Issuing...' : 'Issue invoice'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

function PaymentDialog({
  error,
  invoice,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  error?: BackendError
  invoice: Invoice
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: RecordPaymentPayload) => void
}) {
  const remaining = Math.max(Number(invoice.totalAmount) - Number(invoice.paidAmount), 0)
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: String(remaining || ''),
      method: 'BANK_TRANSFER',
      referenceNo: '',
      paidAt: '',
    },
  })

  return (
    <DialogFrame title="Record Payment" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          onSubmit({
            amount: values.amount,
            method: values.method,
            referenceNo: values.referenceNo.trim() === '' ? null : values.referenceNo,
            paidAt: values.paidAt.trim() === '' ? null : values.paidAt,
          }),
        )}
      >
        <FinanceError error={error} />
        <p className="text-sm text-slate-600">
          Remaining amount: <span className="font-semibold">{formatMoney(remaining)}</span>
        </p>
        <FormField label="Amount" error={form.formState.errors.amount?.message}>
          <Input type="number" min="0.01" step="0.01" disabled={isSubmitting} {...form.register('amount')} />
        </FormField>
        <FormField label="Method" error={form.formState.errors.method?.message}>
          <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" disabled={isSubmitting} {...form.register('method')}>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Reference No" error={form.formState.errors.referenceNo?.message}>
          <Input disabled={isSubmitting} {...form.register('referenceNo')} />
        </FormField>
        <FormField label="Paid At" error={form.formState.errors.paidAt?.message}>
          <Input type="datetime-local" disabled={isSubmitting} {...form.register('paidAt')} />
        </FormField>
        <DialogActions
          submitLabel={isSubmitting ? 'Recording...' : 'Record payment'}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
      </form>
    </DialogFrame>
  )
}

export function FinanceError({ error }: { error?: BackendError }) {
  if (!error) {
    return null
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {error.code ? <p className="font-medium">{error.code}</p> : null}
      <p>{friendlyFinanceError(error)}</p>
    </div>
  )
}

function friendlyFinanceError(error: BackendError) {
  if (error.code === 'PAYMENT_EXCEEDS_REMAINING') {
    return 'Payment amount exceeds the invoice remaining balance.'
  }
  if (error.code === 'ORDER_NOT_FULFILLED' || error.code === 'INVALID_ORDER_STATUS') {
    return 'Invoice can only be generated from a fulfilled sales order.'
  }
  if (error.code === 'INVOICE_ALREADY_EXISTS' || error.code === 'CONFLICT') {
    return 'An invoice already exists for this sales order.'
  }
  if (error.code === 'INVALID_INVOICE_STATUS') {
    return 'This action is not valid for the current invoice status.'
  }
  if (error.code === 'FORBIDDEN') {
    return 'You do not have permission to perform this action.'
  }
  return error.message
}
