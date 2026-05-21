import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  CustomerStatus,
  CustomerType,
  ProductStatus,
} from '@/types/master-data'

const statusClasses: Record<CustomerStatus | ProductStatus, string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700',
  INACTIVE: 'border-slate-200 bg-slate-50 text-slate-700',
}

const customerTypeClasses: Record<CustomerType, string> = {
  B2B: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  B2C: 'border-blue-200 bg-blue-50 text-blue-700',
}

export function EntityStatusBadge({
  status,
}: {
  status: CustomerStatus | ProductStatus
}) {
  return (
    <Badge variant="outline" className={cn('shadow-none', statusClasses[status])}>
      {status}
    </Badge>
  )
}

export function CustomerTypeBadge({ type }: { type: CustomerType }) {
  return (
    <Badge
      variant="outline"
      className={cn('shadow-none', customerTypeClasses[type])}
    >
      {type}
    </Badge>
  )
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'shadow-none',
        isActive
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-slate-200 bg-slate-50 text-slate-700',
      )}
    >
      {isActive ? 'ACTIVE' : 'INACTIVE'}
    </Badge>
  )
}
