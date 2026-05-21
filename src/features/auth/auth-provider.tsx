import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getCurrentUser, login as loginRequest } from '@/features/auth/auth-api'
import { AuthContext } from '@/features/auth/auth-context'
import { setUnauthorizedHandler } from '@/lib/api-client'
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from '@/lib/auth-storage'
import type { LoginPayload, AuthUser } from '@/types/auth'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getStoredAccessToken(),
  )
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    clearStoredAccessToken()
    setAccessToken(null)
    setUser(null)
  }, [])

  const logout = useCallback(() => {
    clearSession()

    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }, [clearSession])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    })

    return () => {
      setUnauthorizedHandler(undefined)
    }
  }, [clearSession])

  useEffect(() => {
    let isActive = true

    async function bootstrapCurrentUser() {
      const storedToken = getStoredAccessToken()

      if (!storedToken) {
        if (isActive) {
          setIsLoading(false)
        }
        return
      }

      try {
        const currentUser = await getCurrentUser()

        if (isActive) {
          setAccessToken(storedToken)
          setUser(currentUser)
        }
      } catch {
        if (isActive) {
          clearSession()
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void bootstrapCurrentUser()

    return () => {
      isActive = false
    }
  }, [clearSession])

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginRequest(payload)

    setStoredAccessToken(result.accessToken)
    setAccessToken(result.accessToken)
    setUser(result.user)
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      logout,
    }),
    [accessToken, isLoading, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
