import {
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  Receipt,
  ShieldCheck,
  Store,
  Users,
  Warehouse,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/users'
import { userRoles } from '@/types/users'

const navigationItems = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/app/users', icon: Users, allowedRoles: ['TENANT_ADMIN'] },
  { label: 'Customers', to: '/app/customers', icon: Store },
  { label: 'Products', to: '/app/products', icon: Package },
  { label: 'Warehouses', to: '/app/warehouses', icon: Warehouse },
  { label: 'Inventory', to: '/app/inventory', icon: PackageCheck },
  { label: 'Sales Orders', to: '/app/sales-orders', icon: ClipboardList },
  {
    label: 'Invoices',
    to: '/app/invoices',
    icon: Receipt,
    allowedRoles: ['TENANT_ADMIN', 'FINANCE', 'VIEWER'],
  },
  {
    label: 'Payments',
    to: '/app/payments',
    icon: CreditCard,
    allowedRoles: ['TENANT_ADMIN', 'FINANCE', 'VIEWER'],
  },
  {
    label: 'Audit Logs',
    to: '/app/audit-logs',
    icon: FileText,
    allowedRoles: ['TENANT_ADMIN'],
  },
]

export function AppLayout() {
  const auth = useAuth()
  const user = auth.user
  const role = isUserRole(user?.role) ? user.role : undefined

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-semibold">CoreERP Admin</span>
        </div>
        <nav className="space-y-1 px-3 py-4" aria-label="Primary">
          {navigationItems
            .filter(
              (item) =>
                !item.allowedRoles ||
                (role ? item.allowedRoles.includes(role) : false),
            )
            .map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                      isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700',
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
        </nav>
      </aside>

      <div className="flex h-screen min-w-0 flex-col lg:pl-64">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.tenantCode}</p>
              <p className="text-xs text-slate-500">Authenticated workspace</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 sm:flex">
              <div className="max-w-56 text-right">
                <p className="truncate text-sm font-medium">{user?.fullName}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {user?.role}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={auth.logout}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Logout
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function isUserRole(role: string | undefined): role is UserRole {
  return userRoles.includes(role as UserRole)
}
