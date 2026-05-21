import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/types/users'

const roleClassName: Record<UserRole, string> = {
  TENANT_ADMIN: 'border-purple-200 bg-purple-50 text-purple-700',
  SALES: 'border-blue-200 bg-blue-50 text-blue-700',
  WAREHOUSE: 'border-amber-200 bg-amber-50 text-amber-700',
  FINANCE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  VIEWER: 'border-slate-200 bg-slate-50 text-slate-700',
}

const statusClassName: Record<UserStatus, string> = {
  ACTIVE: 'border-green-200 bg-green-50 text-green-700',
  INACTIVE: 'border-slate-200 bg-slate-50 text-slate-700',
}

type UserRoleBadgeProps = {
  role: UserRole
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return (
    <Badge variant="outline" className={cn('shadow-none', roleClassName[role])}>
      {role}
    </Badge>
  )
}

type UserStatusBadgeProps = {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('shadow-none', statusClassName[status])}
    >
      {status}
    </Badge>
  )
}
