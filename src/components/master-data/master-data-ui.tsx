import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { BackendError } from '@/lib/api-error'
import type { PaginationMeta } from '@/types/api'

export function FeedbackMessage({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
      {message}
    </div>
  )
}

export function ResourceErrorState({ error }: { error: BackendError }) {
  const isForbidden = error.code === 'FORBIDDEN'

  return (
    <div
      className={
        isForbidden
          ? 'flex items-start gap-3 p-6 text-sm text-amber-800'
          : 'flex items-start gap-3 p-6 text-sm text-red-700'
      }
    >
      <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
      <div>
        {error.code ? <p className="font-medium">{error.code}</p> : null}
        <p>
          {isForbidden
            ? 'You do not have permission to perform this action.'
            : error.message}
        </p>
      </div>
    </div>
  )
}

export function FieldError({ error }: { error?: BackendError }) {
  if (!error) {
    return null
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {error.code ? <p className="font-medium">{error.code}</p> : null}
      <p>{error.message}</p>
    </div>
  )
}

type DialogFrameProps = {
  children: ReactNode
  title: string
  description?: string
  onClose: () => void
}

export function DialogFrame({
  children,
  description = 'Changes apply only to the current tenant.',
  title,
  onClose,
}: DialogFrameProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <section className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </section>
    </div>
  )
}

type DialogActionsProps = {
  isSubmitting: boolean
  submitLabel: string
  onClose: () => void
}

export function DialogActions({
  isSubmitting,
  submitLabel,
  onClose,
}: DialogActionsProps) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting}
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </div>
  )
}

type FormFieldProps = {
  children: ReactNode
  error?: string
  label: string
}

export function FormField({ children, error, label }: FormFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}

type PaginationControlsProps = {
  isFetching: boolean
  meta?: PaginationMeta
  page: number
  totalLabel: string
  onPageChange: (page: number) => void
}

export function PaginationControls({
  isFetching,
  meta,
  page,
  totalLabel,
  onPageChange,
}: PaginationControlsProps) {
  const currentPage = meta?.page ?? page
  const totalPages = Math.max(meta?.totalPages ?? 1, 1)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        {meta ? `${meta.total} ${totalLabel} total` : `${totalLabel} total unavailable`}
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isFetching}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || isFetching}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
