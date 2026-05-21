import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SalesOrderStatus } from '@/types/sales-orders'

const statusClasses: Record<SalesOrderStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700',
  FULFILLED: 'border-purple-200 bg-purple-50 text-purple-700',
  COMPLETED: 'border-green-200 bg-green-50 text-green-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
}

export function SalesOrderStatusBadge({
  status,
}: {
  status: SalesOrderStatus
}) {
  return (
    <Badge variant="outline" className={cn('shadow-none', statusClasses[status])}>
      {status}
    </Badge>
  )
}
