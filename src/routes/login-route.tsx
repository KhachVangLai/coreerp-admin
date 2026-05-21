import { Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function LoginRoute() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">CoreERP Admin</h1>
            <p className="text-sm text-slate-500">Login placeholder</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            Authentication UI will be implemented in a later task.
          </div>
          <Button asChild className="w-full">
            <Link to="/app/dashboard">Open dashboard shell</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
