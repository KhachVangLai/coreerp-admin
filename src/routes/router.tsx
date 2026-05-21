import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/routing/protected-route'
import { DashboardRoute } from '@/routes/dashboard-route'
import { LoginRoute } from '@/routes/login-route'
import { PlaceholderRoute } from '@/routes/placeholder-route'
import { UsersRoute } from '@/routes/users-route'

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
            path: ':module',
            element: <PlaceholderRoute />,
          },
        ],
      },
    ],
  },
])
