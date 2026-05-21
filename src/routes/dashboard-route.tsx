import { Badge } from '@/components/ui/badge'

export function DashboardRoute() {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Placeholder for the CoreERP admin overview.
          </p>
        </div>
        <Badge variant="outline">FE01 foundation</Badge>
      </div>

      <div className="rounded-md border border-dashed border-slate-300 bg-white p-6">
        <p className="text-sm text-slate-600">
          Business workflow pages will be added in later tasks.
        </p>
      </div>
    </section>
  )
}
