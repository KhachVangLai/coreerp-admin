import { useQuery } from '@tanstack/react-query'
import { Eye, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PaginationControls, ResourceErrorState } from '@/components/master-data/master-data-ui'
import { SalesOrderStatusBadge } from '@/components/sales-orders/sales-order-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import { listCustomers, listWarehouses } from '@/features/master-data/master-data-api'
import { listSalesOrders } from '@/features/sales-orders/sales-orders-api'
import { normalizeApiError } from '@/lib/api-error'
import { formatDate, formatMoney } from '@/lib/format'
import {
  formatSalesOrderCustomer,
  formatSalesOrderWarehouse,
} from '@/lib/sales-order-format'
import type { Customer, Warehouse } from '@/types/master-data'
import type {
  ListSalesOrdersParams,
  SalesOrder,
  SalesOrderStatus,
} from '@/types/sales-orders'
import { salesOrderStatuses } from '@/types/sales-orders'

const defaultLimit = 20
const allStatusesValue = 'ALL_STATUSES'
const allCustomersValue = 'ALL_CUSTOMERS'
const allWarehousesValue = 'ALL_WAREHOUSES'

type SalesOrderFilters = {
  page: number
  limit: number
  q: string
  status: SalesOrderStatus | ''
  customerId: string
  warehouseId: string
}

export function SalesOrdersRoute() {
  const auth = useAuth()
  const canCreate =
    auth.user?.role === 'TENANT_ADMIN' || auth.user?.role === 'SALES'
  const [filters, setFilters] = useState<SalesOrderFilters>({
    page: 1,
    limit: defaultLimit,
    q: '',
    status: '',
    customerId: '',
    warehouseId: '',
  })
  const [searchValue, setSearchValue] = useState('')

  const ordersQuery = useQuery({
    queryKey: ['sales-orders', filters],
    queryFn: () => listSalesOrders(toListParams(filters)),
  })
  const customersQuery = useQuery({
    queryKey: ['sales-orders-customers'],
    queryFn: () => listCustomers({ page: 1, limit: 100, status: 'ACTIVE' }),
  })
  const warehousesQuery = useQuery({
    queryKey: ['sales-orders-warehouses'],
    queryFn: () => listWarehouses({ page: 1, limit: 100, isActive: true }),
  })

  const listError = ordersQuery.error
    ? normalizeApiError(ordersQuery.error)
    : undefined
  const orders = ordersQuery.data?.data ?? []

  function applyFilters(nextFilters: Partial<SalesOrderFilters>) {
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
          <h1 className="text-2xl font-semibold tracking-tight">Sales Orders</h1>
          <p className="text-sm text-slate-500">
            Manage sales orders from draft to fulfillment
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link to="/app/sales-orders/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Sales Order
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <form
          className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_220px_220px_auto]"
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
              placeholder="Search order code"
              aria-label="Search sales orders"
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
                    : (event.target.value as SalesOrderStatus),
              })
            }
            aria-label="Filter by status"
          >
            <option value={allStatusesValue}>All statuses</option>
            {salesOrderStatuses.map((status) => (
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
          <WarehouseSelect
            warehouses={warehousesQuery.data?.data ?? []}
            value={filters.warehouseId || allWarehousesValue}
            onChange={(warehouseId) => applyFilters({ warehouseId })}
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {ordersQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading sales orders...</div>
        ) : listError ? (
          <ResourceErrorState error={listError} />
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No sales orders match the current filters.
          </div>
        ) : (
          <SalesOrdersTable orders={orders} />
        )}
      </div>

      <PaginationControls
        isFetching={ordersQuery.isFetching}
        meta={ordersQuery.data?.meta}
        page={filters.page}
        totalLabel="sales orders"
        onPageChange={(page) => applyFilters({ page })}
      />
    </section>
  )
}

function toListParams(filters: SalesOrderFilters): ListSalesOrdersParams {
  return {
    page: filters.page,
    limit: filters.limit,
    q: filters.q || undefined,
    status: filters.status || undefined,
    customerId: filters.customerId || undefined,
    warehouseId: filters.warehouseId || undefined,
  }
}

function SalesOrdersTable({ orders }: { orders: SalesOrder[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Order Code</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Warehouse</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Total Amount</th>
            <th className="px-4 py-3">Created At</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {order.orderCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {formatSalesOrderCustomer(order)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {formatSalesOrderWarehouse(order)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <SalesOrderStatusBadge status={order.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {formatMoney(order.totalAmount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(order.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/app/sales-orders/${order.id}`}>
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
        onChange(
          event.target.value === allCustomersValue ? '' : event.target.value,
        )
      }
      aria-label="Filter by customer"
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

function WarehouseSelect({
  onChange,
  value,
  warehouses,
}: {
  onChange: (warehouseId: string) => void
  value: string
  warehouses: Warehouse[]
}) {
  return (
    <select
      className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value === allWarehousesValue ? '' : event.target.value,
        )
      }
      aria-label="Filter by warehouse"
    >
      <option value={allWarehousesValue}>All warehouses</option>
      {warehouses.map((warehouse) => (
        <option key={warehouse.id} value={warehouse.id}>
          {warehouse.code} - {warehouse.name}
        </option>
      ))}
    </select>
  )
}
