import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import { normalizeApiError, type BackendError } from '@/lib/api-error'

const loginSchema = z.object({
  tenantCode: z.string().min(1, 'Tenant code is required.'),
  email: z.string().min(1, 'Email is required.').email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginRoute() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [backendError, setBackendError] = useState<BackendError | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantCode: '',
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: auth.login,
    onSuccess: () => {
      const from =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state
          ? (location.state.from as { pathname?: string }).pathname
          : undefined

      navigate(from?.startsWith('/app') ? from : '/app/dashboard', {
        replace: true,
      })
    },
    onError: (error) => {
      setBackendError(normalizeApiError(error))
    },
  })

  if (auth.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Checking session...
      </main>
    )
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }

  const isSubmitting = loginMutation.isPending

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">CoreERP Admin</h1>
            <p className="text-sm text-slate-500">Sign in to your tenant workspace</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            setBackendError(null)
            loginMutation.mutate(values)
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="tenantCode">
              Tenant code
            </label>
            <Input
              id="tenantCode"
              autoComplete="organization"
              disabled={isSubmitting}
              {...form.register('tenantCode')}
            />
            {form.formState.errors.tenantCode ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.tenantCode.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              {...form.register('email')}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {backendError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {backendError.code ? (
                <p className="font-medium">{backendError.code}</p>
              ) : null}
              <p>{backendError.message}</p>
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-700">Demo accounts</p>
            <p>Tenant: minh-anh-retail</p>
          </div>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            <li className="truncate" title="admin@minhanh.vn / 123456">
              admin@minhanh.vn / 123456
            </li>
            <li className="truncate" title="sales@minhanh.vn / 123456">
              sales@minhanh.vn / 123456
            </li>
            <li className="truncate" title="warehouse@minhanh.vn / 123456">
              warehouse@minhanh.vn / 123456
            </li>
            <li className="truncate" title="finance@minhanh.vn / 123456">
              finance@minhanh.vn / 123456
            </li>
            <li className="truncate" title="viewer@minhanh.vn / 123456">
              viewer@minhanh.vn / 123456
            </li>
          </ul>
        </div>
      </section>
    </main>
  )
}
