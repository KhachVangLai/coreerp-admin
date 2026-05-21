import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { PaymentMethodBadge } from '@/components/finance/finance-badges'
import { PaginationControls, ResourceErrorState } from '@/components/master-data/master-data-ui'
import { listPayments } from '@/features/finance/finance-api'
import { normalizeApiError } from '@/lib/api-error'
import { formatDate, formatMoney } from '@/lib/format'
import type { ListPaymentsParams, Payment, PaymentMethod } from '@/types/finance'
import { paymentMethods } from '@/types/finance'

const defaultLimit = 20
const allMethodsValue = 'ALL_METHODS'

type PaymentFilters = {
  page: number
  limit: number
  method: PaymentMethod | ''
}

export function PaymentsRoute() {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: defaultLimit,
    method: '',
  })
  const paymentsQuery = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => listPayments(toListParams(filters)),
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
        >
          <option value={allMethodsValue}>All methods</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {paymentsQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading payments...</div>
        ) : error ? (
          <ResourceErrorState error={error} />
        ) : payments.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No payments match the current filters.
          </div>
        ) : (
          <PaymentsTable payments={payments} />
        )}
      </div>

      <PaginationControls
        isFetching={paymentsQuery.isFetching}
        meta={paymentsQuery.data?.meta}
        page={filters.page}
        totalLabel="payments"
        onPageChange={(page) => applyFilters({ page })}
      />
    </section>
  )
}

function toListParams(filters: PaymentFilters): ListPaymentsParams {
  return {
    page: filters.page,
    limit: filters.limit,
    method: filters.method || undefined,
  }
}

function PaymentsTable({ payments }: { payments: Payment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Paid At</th>
            <th className="px-4 py-3">Invoice</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Reference No</th>
            <th className="px-4 py-3">Created At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(payment.paidAt)}</td>
              <td className="whitespace-nowrap px-4 py-3">{payment.invoiceCode ?? payment.invoiceId}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatMoney(payment.amount)}</td>
              <td className="whitespace-nowrap px-4 py-3"><PaymentMethodBadge method={payment.method} /></td>
              <td className="whitespace-nowrap px-4 py-3">{payment.referenceNo || '-'}</td>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(payment.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
