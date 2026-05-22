import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AuditActionBadgeProps = {
  action: string
}

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  return (
    <Badge variant="outline" className={cn('font-mono', actionBadgeClass(action))}>
      {action}
    </Badge>
  )
}

function actionBadgeClass(action: string) {
  if (action.startsWith('USER_')) {
    return 'border-purple-200 bg-purple-50 text-purple-700'
  }

  if (
    action.startsWith('CUSTOMER_') ||
    action.startsWith('PRODUCT_') ||
    action.startsWith('WAREHOUSE_')
  ) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (action.startsWith('STOCK_')) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (action.startsWith('SALES_ORDER_')) {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  }

  if (action.startsWith('INVOICE_')) {
    return 'border-cyan-200 bg-cyan-50 text-cyan-700'
  }

  if (action.startsWith('PAYMENT_')) {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}
