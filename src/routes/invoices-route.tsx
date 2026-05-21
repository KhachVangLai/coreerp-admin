import { useQuery } from '@tanstack/react-query'
import { Eye, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { InvoiceStatusBadge } from '@/components/finance/finance-badges'
import { PaginationControls, ResourceErrorState } from '@/components/master-data/master-data-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listCustomers } from '@/features/master-data/master-data-api'
import { listInvoices } from '@/features/finance/finance-api'
import { normalizeApiError } from '@/lib/api-error'
import { formatDate, formatMoney } from '@/lib/format'
import type { Customer } from '@/types/master-data'
import type { Invoice, InvoiceStatus, ListInvoicesParams } from '@/types/finance'
import { invoiceStatuses } from '@/types/finance'

const defaultLimit = 20
const allStatusesValue = 'ALL_STATUSES'
const allCustomersValue = 'ALL_CUSTOMERS'

type InvoiceFilters = {
  page: number
  limit: number
  q: string
  status: InvoiceStatus | ''
  customerId: string
}

export function InvoicesRoute() {
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: defaultLimit,
    q: '',
    status: '',
    customerId: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const invoicesQuery = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => listInvoices(toListParams(filters)),
  })
  const customersQuery = useQuery({
    queryKey: ['invoice-customers'],
    queryFn: () => listCustomers({ page: 1, limit: 100, status: 'ACTIVE' }),
  })

  function applyFilters(nextFilters: Partial<InvoiceFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1,
    }))
  }

  const error = invoicesQuery.error
    ? normalizeApiError(invoicesQuery.error)
    : undefined
  const invoices = invoicesQuery.data?.data ?? []

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-slate-500">
          Manage invoice snapshots and payment status
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_220px_auto]"
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
              placeholder="Search invoice code"
              aria-label="Search invoices"
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
                    : (event.target.value as InvoiceStatus),
              })
            }
          >
            <option value={allStatusesValue}>All statuses</option>
            {invoiceStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <CustomerSelect
            customers={customersQuery.data?.data ?? []}
            value={filters.customerId || allCustomersValue}
            onChange={(customerId) => applyFilters({ customerId })}
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {invoicesQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading invoices...</div>
        ) : error ? (
          <ResourceErrorState error={error} />
        ) : invoices.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No invoices match the current filters.
          </div>
        ) : (
          <InvoicesTable invoices={invoices} />
        )}
      </div>

      <PaginationControls
        isFetching={invoicesQuery.isFetching}
        meta={invoicesQuery.data?.meta}
        page={filters.page}
        totalLabel="invoices"
        onPageChange={(page) => applyFilters({ page })}
      />
    </section>
  )
}

function toListParams(filters: InvoiceFilters): ListInvoicesParams {
  return {
    page: filters.page,
    limit: filters.limit,
    q: filters.q || undefined,
    status: filters.status || undefined,
    customerId: filters.customerId || undefined,
  }
}

function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Invoice Code</th>
            <th className="px-4 py-3">Sales Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Total Amount</th>
            <th className="px-4 py-3 text-right">Paid Amount</th>
            <th className="px-4 py-3">Issued At</th>
            <th className="px-4 py-3">Created At</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {invoice.invoiceCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {invoice.orderCode ?? invoice.salesOrder?.orderCode ?? invoice.salesOrderId}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {invoice.customerName ?? invoice.customer?.name ?? invoice.customerId ?? '-'}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {formatMoney(invoice.totalAmount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {formatMoney(invoice.paidAmount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {invoice.issuedAt ? formatDate(invoice.issuedAt) : '-'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(invoice.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/app/invoices/${invoice.id}`}>
                    <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                    View
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CustomerSelect({
  customers,
  onChange,
  value,
}: {
  customers: Customer[]
  onChange: (customerId: string) => void
  value: string
}) {
  return (
    <select
      className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      value={value}
      onChange={(event) =>
        onChange(event.target.value === allCustomersValue ? '' : event.target.value)
      }
    >
      <option value={allCustomersValue}>All customers</option>
      {customers.map((customer) => (
        <option key={customer.id} value={customer.id}>
          {customer.code} - {customer.name}
        </option>
      ))}
    </select>
  )
}
