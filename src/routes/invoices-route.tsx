import { useQuery } from '@tanstack/react-query'
import { Eye, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { InvoiceStatusBadge } from '@/components/finance/finance-badges'
import {
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
import { listCustomers } from '@/features/master-data/master-data-api'
import { listInvoices } from '@/features/finance/finance-api'
import { listSalesOrders } from '@/features/sales-orders/sales-orders-api'
import { normalizeApiError } from '@/lib/api-error'
import { formatDate, formatMoney } from '@/lib/format'
import type { Customer } from '@/types/master-data'
import type { SalesOrder } from '@/types/sales-orders'
import type { Invoice, InvoiceStatus, ListInvoicesParams } from '@/types/finance'
import { invoiceStatuses } from '@/types/finance'

const defaultLimit = 20
const allStatusesValue = 'ALL_STATUSES'
const allCustomersValue = 'ALL_CUSTOMERS'
const allSalesOrdersValue = 'ALL_SALES_ORDERS'

type InvoiceFilters = {
  page: number
  limit: number
  q: string
  status: InvoiceStatus | ''
  customerId: string
  salesOrderId: string
}

export function InvoicesRoute() {
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: defaultLimit,
    q: '',
    status: '',
    customerId: '',
    salesOrderId: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [salesOrderLookupValue, setSalesOrderLookupValue] = useState('')
  const debouncedSalesOrderLookupValue = useDebouncedValue(
    salesOrderLookupValue,
    300,
  )
  const invoicesQuery = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => listInvoices(toListParams(filters)),
  })
  const customersQuery = useQuery({
    queryKey: ['invoice-customers'],
    queryFn: () => listCustomers({ page: 1, limit: 100, status: 'ACTIVE' }),
  })
  const salesOrdersQuery = useQuery({
    queryKey: ['invoice-sales-orders', debouncedSalesOrderLookupValue],
    queryFn: () =>
      listSalesOrders({
        page: 1,
        limit: 100,
        q: debouncedSalesOrderLookupValue.trim() || undefined,
      }),
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
          className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_170px_220px_minmax(260px,0.8fr)_auto]"
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
          <SalesOrderValueHelp
            lookupValue={salesOrderLookupValue}
            salesOrders={salesOrdersQuery.data?.data ?? []}
            value={filters.salesOrderId}
            onLookupChange={(value) => {
              setSalesOrderLookupValue(value)
              if (filters.salesOrderId) {
                applyFilters({ salesOrderId: '' })
              }
            }}
            onValueChange={(salesOrderId) => applyFilters({ salesOrderId })}
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <TableCard>
        {invoicesQuery.isLoading ? (
          <TableState>Loading invoices...</TableState>
        ) : error ? (
          <ResourceErrorState error={error} />
        ) : invoices.length === 0 ? (
          <TableState>No invoices match the current filters.</TableState>
        ) : (
          <InvoicesTable invoices={invoices} />
        )}
        <TablePagination>
          <PaginationControls
            isFetching={invoicesQuery.isFetching}
            meta={invoicesQuery.data?.meta}
            page={filters.page}
            totalLabel="invoices"
            onPageChange={(page) => applyFilters({ page })}
          />
        </TablePagination>
      </TableCard>
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
    salesOrderId: filters.salesOrderId || undefined,
  }
}

function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <TableScroll>
      <table className={`${tableClassName} min-w-[1260px]`}>
        <thead className={tableHeaderClassName}>
          <tr>
            <th className={tableKeyHeaderCellClassName}>
              <TableColumnHeader
                label="Invoice Code"
              />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader
                label="Sales Order"
              />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader
                label="Customer"
              />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader
                label="Status"
              />
            </th>
            <th className={`${tableHeaderCellClassName} text-right`}>
              <TableColumnHeader
                align="right"
                label="Total Amount"
              />
            </th>
            <th className={`${tableHeaderCellClassName} text-right`}>
              <TableColumnHeader
                align="right"
                label="Paid Amount"
              />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Issued At" />
            </th>
            <th className={tableHeaderCellClassName}>
              <TableColumnHeader label="Created At" />
            </th>
            <th className={tableActionHeaderCellClassName}>
              <TableColumnHeader align="right" label="Actions" />
            </th>
          </tr>
        </thead>
        <tbody className={tableBodyClassName}>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="group hover:bg-slate-50">
              <td className={`${tableKeyCellClassName} font-medium text-slate-900`}>
                <TruncatedCellText maxWidth="max-w-[180px]" title={invoice.invoiceCode}>
                  {invoice.invoiceCode}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} text-slate-700`}>
                <TruncatedCellText
                  maxWidth="max-w-[180px]"
                  title={invoice.orderCode ?? invoice.salesOrder?.orderCode ?? invoice.salesOrderId}
                >
                  {invoice.orderCode ?? invoice.salesOrder?.orderCode ?? invoice.salesOrderId}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} text-slate-700`}>
                <TruncatedCellText
                  maxWidth="max-w-[240px]"
                  title={invoice.customerName ?? invoice.customer?.name ?? invoice.customerId ?? undefined}
                >
                  {invoice.customerName ?? invoice.customer?.name ?? invoice.customerId ?? '-'}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap`}>
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {formatMoney(invoice.totalAmount)}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {formatMoney(invoice.paidAmount)}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-slate-600`}>
                {invoice.issuedAt ? formatDate(invoice.issuedAt) : '-'}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-slate-600`}>
                {formatDate(invoice.createdAt)}
              </td>
              <td className={tableActionCellClassName}>
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
    </TableScroll>
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

function SalesOrderValueHelp({
  lookupValue,
  onLookupChange,
  onValueChange,
  salesOrders,
  value,
}: {
  lookupValue: string
  onLookupChange: (value: string) => void
  onValueChange: (salesOrderId: string) => void
  salesOrders: SalesOrder[]
  value: string
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(140px,0.8fr)_minmax(160px,1fr)]">
      <Input
        value={lookupValue}
        onChange={(event) => onLookupChange(event.target.value)}
        placeholder="Find order code"
        aria-label="Search sales order value help"
      />
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        value={value || allSalesOrdersValue}
        onChange={(event) =>
          onValueChange(
            event.target.value === allSalesOrdersValue ? '' : event.target.value,
          )
        }
        aria-label="Filter by sales order"
      >
        <option value={allSalesOrdersValue}>All sales orders</option>
        {salesOrders.map((order) => (
          <option key={order.id} value={order.id}>
            {order.orderCode}
          </option>
        ))}
      </select>
    </div>
  )
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
