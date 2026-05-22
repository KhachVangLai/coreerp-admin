import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  CreditCard,
  FileText,
  Package,
  PackageCheck,
  Plus,
  Receipt,
  Store,
  Warehouse,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'

import { AuditActionBadge } from '@/components/audit-logs/audit-log-badges'
import { InvoiceStatusBadge } from '@/components/finance/finance-badges'
import { SalesOrderStatusBadge } from '@/components/sales-orders/sales-order-badges'
import { UserRoleBadge } from '@/components/users/user-badges'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { listAuditLogs } from '@/features/audit-logs/audit-logs-api'
import { listInvoices, listPayments } from '@/features/finance/finance-api'
import { listStockItems } from '@/features/inventory/inventory-api'
import {
  listCustomers,
  listProducts,
  listWarehouses,
} from '@/features/master-data/master-data-api'
import { listSalesOrders } from '@/features/sales-orders/sales-orders-api'
import { normalizeApiError } from '@/lib/api-error'
import { formatDate, formatMoney } from '@/lib/format'
import type { AuditLog } from '@/types/audit-logs'
import type { Invoice, InvoiceStatus } from '@/types/finance'
import { invoiceStatuses } from '@/types/finance'
import type { SalesOrder, SalesOrderStatus } from '@/types/sales-orders'
import { salesOrderStatuses } from '@/types/sales-orders'
import type { UserRole } from '@/types/users'
import { userRoles } from '@/types/users'

const countLimit = 1
const snapshotLimit = 20
const recentLimit = 5

type CountQuery = {
  data?: { meta?: { total: number } }
  error: Error | null
  isLoading: boolean
}

export function DashboardRoute() {
  const { user } = useAuth()
  const role = isUserRole(user?.role) ? user.role : undefined
  const canViewAuditLogs = role === 'TENANT_ADMIN'

  const customersQuery = useQuery({
    queryKey: ['dashboard', 'customers-count'],
    queryFn: () => listCustomers({ page: 1, limit: countLimit }),
  })
  const productsQuery = useQuery({
    queryKey: ['dashboard', 'products-count'],
    queryFn: () => listProducts({ page: 1, limit: countLimit }),
  })
  const warehousesQuery = useQuery({
    queryKey: ['dashboard', 'warehouses-count'],
    queryFn: () => listWarehouses({ page: 1, limit: countLimit }),
  })
  const stockItemsQuery = useQuery({
    queryKey: ['dashboard', 'stock-items-count'],
    queryFn: () => listStockItems({ page: 1, limit: countLimit }),
  })
  const salesOrdersQuery = useQuery({
    queryKey: ['dashboard', 'sales-orders-snapshot'],
    queryFn: () => listSalesOrders({ page: 1, limit: snapshotLimit }),
  })
  const invoicesQuery = useQuery({
    queryKey: ['dashboard', 'invoices-snapshot'],
    queryFn: () => listInvoices({ page: 1, limit: snapshotLimit }),
  })
  const paymentsQuery = useQuery({
    queryKey: ['dashboard', 'payments-count'],
    queryFn: () => listPayments({ page: 1, limit: countLimit }),
  })
  const auditLogsQuery = useQuery({
    queryKey: ['dashboard', 'audit-logs-recent'],
    queryFn: () => listAuditLogs({ page: 1, limit: recentLimit }),
    enabled: canViewAuditLogs,
  })

  const salesOrders = salesOrdersQuery.data?.data ?? []
  const invoices = invoicesQuery.data?.data ?? []
  const auditLogs = auditLogsQuery.data?.data ?? []

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, {user?.fullName ?? user?.email}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              CoreERP operational overview
            </p>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Tenant
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {user?.tenantCode}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  User
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {user?.fullName ?? '-'}
                </p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          </div>
          {role ? <UserRoleBadge role={role} /> : null}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Customers"
          icon={Store}
          query={customersQuery}
          to="/app/customers"
        />
        <SummaryCard
          label="Products"
          icon={Package}
          query={productsQuery}
          to="/app/products"
        />
        <SummaryCard
          label="Warehouses"
          icon={Warehouse}
          query={warehousesQuery}
          to="/app/warehouses"
        />
        <SummaryCard
          label="Stock Items"
          icon={PackageCheck}
          query={stockItemsQuery}
          to="/app/inventory"
        />
        <SummaryCard
          label="Sales Orders"
          icon={ClipboardList}
          query={salesOrdersQuery}
          to="/app/sales-orders"
        />
        <SummaryCard
          label="Invoices"
          icon={Receipt}
          query={invoicesQuery}
          to="/app/invoices"
        />
        <SummaryCard
          label="Payments"
          icon={CreditCard}
          query={paymentsQuery}
          to="/app/payments"
        />
      </section>

      <QuickActions role={role} />

      <div className="grid gap-4 xl:grid-cols-2">
        <StatusSnapshot
          title="Sales Order Status"
          description={`Recent status snapshot from the latest ${snapshotLimit} orders.`}
          isLoading={salesOrdersQuery.isLoading}
          error={salesOrdersQuery.error}
          statuses={salesOrderStatuses}
          counts={countByStatus(salesOrders, salesOrderStatuses)}
          renderBadge={(status) => (
            <SalesOrderStatusBadge status={status as SalesOrderStatus} />
          )}
        />
        <StatusSnapshot
          title="Invoice Status"
          description={`Recent status snapshot from the latest ${snapshotLimit} invoices.`}
          isLoading={invoicesQuery.isLoading}
          error={invoicesQuery.error}
          statuses={invoiceStatuses}
          counts={countByStatus(invoices, invoiceStatuses)}
          renderBadge={(status) => <InvoiceStatusBadge status={status as InvoiceStatus} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentSalesOrdersTable
          error={salesOrdersQuery.error}
          isLoading={salesOrdersQuery.isLoading}
          salesOrders={salesOrders.slice(0, recentLimit)}
        />
        <RecentInvoicesTable
          error={invoicesQuery.error}
          invoices={invoices.slice(0, recentLimit)}
          isLoading={invoicesQuery.isLoading}
        />
      </div>

      {canViewAuditLogs ? (
        <RecentAuditLogs
          auditLogs={auditLogs}
          error={auditLogsQuery.error}
          isLoading={auditLogsQuery.isLoading}
        />
      ) : null}
    </section>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  query,
  to,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  query: CountQuery
  to: string
}) {
  const error = query.error ? normalizeApiError(query.error) : undefined
  const isForbidden = error?.code === 'FORBIDDEN'

  return (
    <Link
      to={to}
      className="rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          {query.isLoading ? (
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-200" />
          ) : error ? (
            <p className="mt-2 text-sm text-amber-700">
              {isForbidden ? 'Restricted' : error.code || 'Unavailable'}
            </p>
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">
              {query.data?.meta?.total ?? 0}
            </p>
          )}
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-600">
          <Icon className="h-5 w-5" aria-hidden={true} />
        </div>
      </div>
    </Link>
  )
}

function QuickActions({ role }: { role?: UserRole }) {
  const actions = getQuickActions(role)

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Quick Actions</h2>
          <p className="text-sm text-slate-500">
            Role-aware shortcuts into existing workflows.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <Button key={action.label} variant={action.variant} size="sm" asChild>
              <Link to={action.to}>
                <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                {action.label}
              </Link>
            </Button>
          )
        })}
      </div>
    </section>
  )
}

function StatusSnapshot<TStatus extends string>({
  counts,
  description,
  error,
  isLoading,
  renderBadge,
  statuses,
  title,
}: {
  counts: Record<TStatus, number>
  description: string
  error: Error | null
  isLoading: boolean
  renderBadge: (status: TStatus) => React.ReactNode
  statuses: readonly TStatus[]
  title: string
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="mt-4 space-y-2">
        {isLoading ? (
          <LoadingRows count={5} />
        ) : error ? (
          <SectionError error={error} />
        ) : (
          statuses.map((status) => (
            <div
              key={status}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2"
            >
              {renderBadge(status)}
              <span className="font-semibold tabular-nums text-slate-900">
                {counts[status]}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function RecentSalesOrdersTable({
  error,
  isLoading,
  salesOrders,
}: {
  error: Error | null
  isLoading: boolean
  salesOrders: SalesOrder[]
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <SectionHeader
        title="Recent Sales Orders"
        description="Latest orders from the sales order list."
        to="/app/sales-orders"
      />
      {isLoading ? (
        <div className="p-4">
          <LoadingRows count={5} />
        </div>
      ) : error ? (
        <SectionError error={error} />
      ) : salesOrders.length === 0 ? (
        <EmptyState label="No recent sales orders." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {salesOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    <Link
                      to={`/app/sales-orders/${order.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {order.orderCode}
                    </Link>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function RecentInvoicesTable({
  error,
  invoices,
  isLoading,
}: {
  error: Error | null
  invoices: Invoice[]
  isLoading: boolean
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <SectionHeader
        title="Recent Invoices"
        description="Latest invoices from the invoice list."
        to="/app/invoices"
      />
      {isLoading ? (
        <div className="p-4">
          <LoadingRows count={5} />
        </div>
      ) : error ? (
        <SectionError error={error} />
      ) : invoices.length === 0 ? (
        <EmptyState label="No recent invoices." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    <Link
                      to={`/app/invoices/${invoice.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {invoice.invoiceCode}
                    </Link>
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
                    {formatDate(invoice.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function RecentAuditLogs({
  auditLogs,
  error,
  isLoading,
}: {
  auditLogs: AuditLog[]
  error: Error | null
  isLoading: boolean
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <SectionHeader
        title="Recent Audit Logs"
        description="Latest tenant audit events."
        to="/app/audit-logs"
      />
      {isLoading ? (
        <div className="p-4">
          <LoadingRows count={5} />
        </div>
      ) : error ? (
        <SectionError error={error} />
      ) : auditLogs.length === 0 ? (
        <EmptyState label="No recent audit logs." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <AuditActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="font-medium">{log.entityType ?? '-'}</span>
                    <span className="ml-2 font-mono text-xs text-slate-500">
                      {log.entityId ?? ''}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {log.actorEmail ?? log.actorUserId ?? 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function SectionHeader({
  description,
  title,
  to,
}: {
  description: string
  title: string
  to: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to={to}>View all</Link>
      </Button>
    </div>
  )
}

function SectionError({ error }: { error: Error }) {
  const normalized = normalizeApiError(error)

  return (
    <div className="p-4 text-sm text-amber-700">
      {normalized.code === 'FORBIDDEN' ? (
        <p>This section is restricted for your current role.</p>
      ) : (
        <>
          {normalized.code ? <p className="font-medium">{normalized.code}</p> : null}
          <p>{normalized.message}</p>
        </>
      )}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="p-4 text-sm text-slate-600">{label}</div>
}

function LoadingRows({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-9 animate-pulse rounded-md bg-slate-100"
        />
      ))}
    </div>
  )
}

function countByStatus<TStatus extends string>(
  records: Array<{ status: TStatus }>,
  statuses: readonly TStatus[],
) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<
    TStatus,
    number
  >

  records.forEach((record) => {
    counts[record.status] += 1
  })

  return counts
}

function isUserRole(role: string | undefined): role is UserRole {
  return userRoles.includes(role as UserRole)
}

function getQuickActions(role?: UserRole) {
  const readOnlyActions = [
    { label: 'View Sales Orders', to: '/app/sales-orders', icon: ClipboardList },
    { label: 'View Inventory', to: '/app/inventory', icon: PackageCheck },
    { label: 'View Invoices', to: '/app/invoices', icon: Receipt },
  ]

  if (role === 'TENANT_ADMIN') {
    return [
      { label: 'Create Customer', to: '/app/customers', icon: Store, variant: 'default' as const },
      { label: 'Create Product', to: '/app/products', icon: Package, variant: 'outline' as const },
      { label: 'Create Warehouse', to: '/app/warehouses', icon: Warehouse, variant: 'outline' as const },
      { label: 'Receive Stock', to: '/app/inventory', icon: PackageCheck, variant: 'outline' as const },
      { label: 'Create Sales Order', to: '/app/sales-orders/new', icon: Plus, variant: 'outline' as const },
      { label: 'View Invoices', to: '/app/invoices', icon: Receipt, variant: 'outline' as const },
      { label: 'View Audit Logs', to: '/app/audit-logs', icon: FileText, variant: 'outline' as const },
    ]
  }

  if (role === 'SALES') {
    return [
      { label: 'Create Customer', to: '/app/customers', icon: Store, variant: 'default' as const },
      { label: 'Create Sales Order', to: '/app/sales-orders/new', icon: Plus, variant: 'outline' as const },
      { label: 'View Sales Orders', to: '/app/sales-orders', icon: ClipboardList, variant: 'outline' as const },
    ]
  }

  if (role === 'WAREHOUSE') {
    return [
      { label: 'Receive Stock', to: '/app/inventory', icon: PackageCheck, variant: 'default' as const },
      { label: 'View Sales Orders', to: '/app/sales-orders', icon: ClipboardList, variant: 'outline' as const },
      { label: 'View Inventory', to: '/app/inventory', icon: PackageCheck, variant: 'outline' as const },
    ]
  }

  if (role === 'FINANCE') {
    return [
      { label: 'View Invoices', to: '/app/invoices', icon: Receipt, variant: 'default' as const },
      { label: 'View Payments', to: '/app/payments', icon: CreditCard, variant: 'outline' as const },
      { label: 'View Sales Orders', to: '/app/sales-orders', icon: ClipboardList, variant: 'outline' as const },
    ]
  }

  return readOnlyActions.map((action) => ({
    ...action,
    variant: 'outline' as const,
  }))
}
