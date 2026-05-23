import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { PaymentMethodBadge } from '@/components/finance/finance-badges'
import {
  PaginationControls,
  ResourceErrorState,
  TableCard,
  TableColumnHeader,
  TablePagination,
  TableScroll,
  TableState,
  TruncatedCellText,
  tableBodyClassName,
  tableCellClassName,
  tableClassName,
  tableHeaderCellClassName,
  tableHeaderClassName,
  tableKeyCellClassName,
  tableKeyHeaderCellClassName,
} from '@/components/master-data/master-data-ui'
import { listInvoices, listPayments } from '@/features/finance/finance-api'
import { normalizeApiError } from '@/lib/api-error'
import { formatDate, formatMoney } from '@/lib/format'
import type {
  Invoice,
  ListPaymentsParams,
  Payment,
  PaymentMethod,
} from '@/types/finance'
import { paymentMethods } from '@/types/finance'

const defaultLimit = 20
const allMethodsValue = 'ALL_METHODS'
const allInvoicesValue = 'ALL_INVOICES'

type PaymentFilters = {
  page: number
  limit: number
  invoiceId: string
  method: PaymentMethod | ''
  fromDate: string
  toDate: string
}

export function PaymentsRoute() {
  const [invoiceLookupValue, setInvoiceLookupValue] = useState('')
  const debouncedInvoiceLookupValue = useDebouncedValue(invoiceLookupValue, 300)
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: defaultLimit,
    invoiceId: '',
    method: '',
    fromDate: '',
    toDate: '',
  })
  const paymentsQuery = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => listPayments(toListParams(filters)),
  })
  const invoicesQuery = useQuery({
    queryKey: ['payment-invoices', debouncedInvoiceLookupValue],
    queryFn: () =>
      listInvoices({
        page: 1,
        limit: 100,
        q: debouncedInvoiceLookupValue.trim() || undefined,
      }),
  })
  const error = paymentsQuery.error
    ? normalizeApiError(paymentsQuery.error)
    : undefined
  const payments = paymentsQuery.data?.data ?? []

  function applyFilters(nextFilters: Partial<PaymentFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1,
    }))
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-slate-500">Review recorded payments</p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_170px_170px_170px]">
          <InvoiceValueHelp
            lookupValue={invoiceLookupValue}
            invoices={invoicesQuery.data?.data ?? []}
            value={filters.invoiceId}
            onLookupChange={(value) => {
              setInvoiceLookupValue(value)
              if (filters.invoiceId) {
                applyFilters({ invoiceId: '' })
              }
            }}
            onValueChange={(invoiceId) => applyFilters({ invoiceId })}
          />
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={filters.method || allMethodsValue}
            onChange={(event) =>
              applyFilters({
                method:
                  event.target.value === allMethodsValue
                    ? ''
                    : (event.target.value as PaymentMethod),
              })
            }
            aria-label="Filter by payment method"
          >
            <option value={allMethodsValue}>All methods</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={filters.fromDate}
            onChange={(event) => applyFilters({ fromDate: event.target.value })}
            aria-label="Filter payments from date"
          />
          <input
            type="date"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={filters.toDate}
            onChange={(event) => applyFilters({ toDate: event.target.value })}
            aria-label="Filter payments to date"
          />
        </div>
      </div>

      <TableCard>
        {paymentsQuery.isLoading ? (
          <TableState>Loading payments...</TableState>
        ) : error ? (
          <ResourceErrorState error={error} />
        ) : payments.length === 0 ? (
          <TableState>No payments match the current filters.</TableState>
        ) : (
          <PaymentsTable payments={payments} />
        )}
        <TablePagination>
          <PaginationControls
            isFetching={paymentsQuery.isFetching}
            meta={paymentsQuery.data?.meta}
            page={filters.page}
            totalLabel="payments"
            onPageChange={(page) => applyFilters({ page })}
          />
        </TablePagination>
      </TableCard>
    </section>
  )
}

function toListParams(filters: PaymentFilters): ListPaymentsParams {
  return {
    page: filters.page,
    limit: filters.limit,
    invoiceId: filters.invoiceId || undefined,
    method: filters.method || undefined,
    fromDate: toLocalDayIso(filters.fromDate, 'start'),
    toDate: toLocalDayIso(filters.toDate, 'end'),
  }
}

function InvoiceValueHelp({
  lookupValue,
  invoices,
  onLookupChange,
  onValueChange,
  value,
}: {
  lookupValue: string
  invoices: Invoice[]
  onLookupChange: (value: string) => void
  onValueChange: (invoiceId: string) => void
  value: string
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(140px,0.8fr)_minmax(160px,1fr)]">
      <input
        value={lookupValue}
        onChange={(event) => onLookupChange(event.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        placeholder="Find invoice code"
        aria-label="Search invoice value help"
      />
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        value={value || allInvoicesValue}
        onChange={(event) =>
          onValueChange(
            event.target.value === allInvoicesValue ? '' : event.target.value,
          )
        }
        aria-label="Filter by invoice"
      >
        <option value={allInvoicesValue}>All invoices</option>
        {invoices.map((invoice) => (
          <option key={invoice.id} value={invoice.id}>
            {invoice.invoiceCode}
          </option>
        ))}
      </select>
    </div>
  )
}

function PaymentsTable({ payments }: { payments: Payment[] }) {
  return (
    <TableScroll>
      <table className={`${tableClassName} min-w-[920px]`}>
        <thead className={tableHeaderClassName}>
          <tr>
            <th className={tableKeyHeaderCellClassName}>
              <TableColumnHeader label="Paid At" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Invoice" />
            </th>
            <th className={`${tableHeaderCellClassName} text-right`}>
              <TableColumnHeader align="right" label="Amount" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Method" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Reference No" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Created At" />
            </th>
          </tr>
        </thead>
        <tbody className={tableBodyClassName}>
          {payments.map((payment) => (
            <tr key={payment.id} className="group hover:bg-slate-50">
              <td className={`${tableKeyCellClassName} whitespace-nowrap`}>
                {formatDate(payment.paidAt)}
              </td>
              <td className={tableCellClassName}>
                <TruncatedCellText
                  maxWidth="max-w-[200px]"
                  title={formatPaymentInvoice(payment)}
                >
                  {formatPaymentInvoice(payment)}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {formatMoney(payment.amount)}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap`}>
                <PaymentMethodBadge method={payment.method} />
              </td>
              <td className={tableCellClassName}>
                <TruncatedCellText
                  maxWidth="max-w-[220px]"
                  title={payment.referenceNo ?? undefined}
                >
                  {payment.referenceNo || '-'}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap`}>
                {formatDate(payment.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}

function formatPaymentInvoice(payment: Payment) {
  return payment.invoiceCode ?? payment.invoice?.invoiceCode ?? payment.invoiceId
}

function toLocalDayIso(value: string, boundary: 'start' | 'end') {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  const date =
    boundary === 'start'
      ? new Date(year, month - 1, day, 0, 0, 0, 0)
      : new Date(year, month - 1, day, 23, 59, 59, 999)

  return date.toISOString()
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => window.clearTimeout(timeoutId)
  }, [delayMs, value])

  return debouncedValue
}
