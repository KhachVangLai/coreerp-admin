import { useParams } from 'react-router-dom'

const moduleLabels: Record<string, string> = {
  users: 'Users',
  customers: 'Customers',
  products: 'Products',
  warehouses: 'Warehouses',
  inventory: 'Inventory',
  'sales-orders': 'Sales Orders',
  invoices: 'Invoices',
  payments: 'Payments',
  'audit-logs': 'Audit Logs',
}

export function PlaceholderRoute() {
  const { module } = useParams()
  const label = module ? moduleLabels[module] : undefined

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {label ?? 'Module'} placeholder
        </h1>
        <p className="text-sm text-slate-500">
          This route is reserved for a later implementation task.
        </p>
      </div>

      <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        No business page, mock records, charts, or workflow has been added for
        this placeholder route.
      </div>
    </section>
  )
}
