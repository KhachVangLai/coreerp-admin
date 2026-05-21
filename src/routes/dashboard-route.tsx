import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/use-auth'

export function DashboardRoute() {
  const { user } = useAuth()

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-sm text-slate-500">
            CoreERP Admin dashboard placeholder for {user?.tenantCode}.
          </p>
        </div>
        <Badge variant="outline">{user?.role}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Tenant</p>
          <p className="mt-1 text-sm font-semibold">{user?.tenantCode}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Role</p>
          <p className="mt-1 text-sm font-semibold">{user?.role}</p>
        </div>
      </div>

      <div className="rounded-md border border-dashed border-slate-300 bg-white p-6">
        <p className="text-sm text-slate-600">
          Business workflow pages for master data, inventory, sales orders,
          fulfillment, invoices, payments, and audit logs will be added in later
          tasks.
        </p>
      </div>
    </section>
  )
}
