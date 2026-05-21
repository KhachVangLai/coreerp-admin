import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { InvoiceStatus, PaymentMethod } from '@/types/finance'

const invoiceStatusClasses: Record<InvoiceStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  ISSUED: 'border-blue-200 bg-blue-50 text-blue-700',
  PARTIALLY_PAID: 'border-amber-200 bg-amber-50 text-amber-700',
  PAID: 'border-green-200 bg-green-50 text-green-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
}

const methodClasses: Record<PaymentMethod, string> = {
  CASH: 'border-green-200 bg-green-50 text-green-700',
  BANK_TRANSFER: 'border-blue-200 bg-blue-50 text-blue-700',
  MOMO: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  OTHER: 'border-slate-200 bg-slate-50 text-slate-700',
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('shadow-none', invoiceStatusClasses[status])}
    >
      {status}
    </Badge>
  )
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <Badge variant="outline" className={cn('shadow-none', methodClasses[method])}>
      {method}
    </Badge>
  )
}
