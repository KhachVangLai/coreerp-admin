import { Bell, Building2, Menu, Search } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-semibold">CoreERP Admin</span>
        </div>
        <nav className="space-y-1 px-3 py-4" aria-label="Primary">
          <div className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            Dashboard
          </div>
          <div className="px-3 py-2 text-sm text-slate-500">
            Workflow navigation placeholder
          </div>
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <div>
              <p className="text-sm font-semibold">Admin workspace</p>
              <p className="text-xs text-slate-500">Foundation shell</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
