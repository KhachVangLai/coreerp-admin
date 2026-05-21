import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StockMovementType } from '@/types/inventory'

const movementTypeClasses: Record<StockMovementType, string> = {
  IN: 'border-green-200 bg-green-50 text-green-700',
  ADJUST: 'border-amber-200 bg-amber-50 text-amber-700',
  RESERVE: 'border-blue-200 bg-blue-50 text-blue-700',
  RELEASE: 'border-amber-200 bg-amber-50 text-amber-700',
  OUT: 'border-red-200 bg-red-50 text-red-700',
}

export function MovementTypeBadge({ type }: { type: StockMovementType }) {
  return (
    <Badge
      variant="outline"
      className={cn('shadow-none', movementTypeClasses[type])}
    >
      {type}
    </Badge>
  )
}
