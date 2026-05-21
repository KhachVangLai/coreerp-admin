import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/routing/protected-route'
import { CustomersRoute } from '@/routes/customers-route'
import { DashboardRoute } from '@/routes/dashboard-route'
import { InventoryRoute } from '@/routes/inventory-route'
import { LoginRoute } from '@/routes/login-route'
import { PlaceholderRoute } from '@/routes/placeholder-route'
import { ProductsRoute } from '@/routes/products-route'
import { UsersRoute } from '@/routes/users-route'
import { WarehousesRoute } from '@/routes/warehouses-route'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginRoute />,
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
            element: <DashboardRoute />,
          },
          {
            path: 'users',
            element: <UsersRoute />,
          },
          {
            path: 'customers',
            element: <CustomersRoute />,
          },
          {
            path: 'products',
            element: <ProductsRoute />,
          },
          {
            path: 'warehouses',
            element: <WarehousesRoute />,
          },
          {
            path: 'inventory',
            element: <InventoryRoute />,
          },
          {
            path: ':module',
            element: <PlaceholderRoute />,
          },
        ],
      },
    ],
  },
])
