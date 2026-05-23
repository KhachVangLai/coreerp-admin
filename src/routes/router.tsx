import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/routing/protected-route'

const LoginRoute = lazyRoute(() => import('@/routes/login-route'), 'LoginRoute')
const DashboardRoute = lazyRoute(
  () => import('@/routes/dashboard-route'),
  'DashboardRoute',
)
const UsersRoute = lazyRoute(() => import('@/routes/users-route'), 'UsersRoute')
const CustomersRoute = lazyRoute(
  () => import('@/routes/customers-route'),
  'CustomersRoute',
)
const ProductsRoute = lazyRoute(
  () => import('@/routes/products-route'),
  'ProductsRoute',
)
const WarehousesRoute = lazyRoute(
  () => import('@/routes/warehouses-route'),
  'WarehousesRoute',
)
const InventoryRoute = lazyRoute(
  () => import('@/routes/inventory-route'),
  'InventoryRoute',
)
const SalesOrdersRoute = lazyRoute(
  () => import('@/routes/sales-orders-route'),
  'SalesOrdersRoute',
)
const SalesOrderCreateRoute = lazyRoute(
  () => import('@/routes/sales-order-create-route'),
  'SalesOrderCreateRoute',
)
const SalesOrderDetailRoute = lazyRoute(
  () => import('@/routes/sales-order-detail-route'),
  'SalesOrderDetailRoute',
)
const InvoicesRoute = lazyRoute(
  () => import('@/routes/invoices-route'),
  'InvoicesRoute',
)
const InvoiceDetailRoute = lazyRoute(
  () => import('@/routes/invoice-detail-route'),
  'InvoiceDetailRoute',
)
const PaymentsRoute = lazyRoute(
  () => import('@/routes/payments-route'),
  'PaymentsRoute',
)
const AuditLogsRoute = lazyRoute(
  () => import('@/routes/audit-logs-route'),
  'AuditLogsRoute',
)
const PlaceholderRoute = lazyRoute(
  () => import('@/routes/placeholder-route'),
  'PlaceholderRoute',
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: routeElement(LoginRoute),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/app/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: routeElement(DashboardRoute),
          },
          {
            path: 'users',
            element: routeElement(UsersRoute),
          },
          {
            path: 'customers',
            element: routeElement(CustomersRoute),
          },
          {
            path: 'products',
            element: routeElement(ProductsRoute),
          },
          {
            path: 'warehouses',
            element: routeElement(WarehousesRoute),
          },
          {
            path: 'inventory',
            element: routeElement(InventoryRoute),
          },
          {
            path: 'sales-orders',
            element: routeElement(SalesOrdersRoute),
          },
          {
            path: 'sales-orders/new',
            element: routeElement(SalesOrderCreateRoute),
          },
          {
            path: 'sales-orders/:id',
            element: routeElement(SalesOrderDetailRoute),
          },
          {
            path: 'invoices',
            element: routeElement(InvoicesRoute),
          },
          {
            path: 'invoices/:id',
            element: routeElement(InvoiceDetailRoute),
          },
          {
            path: 'payments',
            element: routeElement(PaymentsRoute),
          },
          {
            path: 'audit-logs',
            element: routeElement(AuditLogsRoute),
          },
          {
            path: ':module',
            element: routeElement(PlaceholderRoute),
          },
        ],
      },
    ],
  },
])

function lazyRoute<T extends Record<string, ComponentType>>(
  importer: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(async () => ({
    default: (await importer())[exportName],
  }))
}

function routeElement(Route: ComponentType) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">
          Loading workspace...
        </div>
      }
    >
      <Route />
    </Suspense>
  )
}
