import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/app-layout'
import { DashboardRoute } from '@/routes/dashboard-route'
import { LoginRoute } from '@/routes/login-route'

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
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardRoute />,
      },
    ],
  },
])
