import { createContext, useState, useEffect, type ReactNode, use } from 'react'
import type { User, AuthContextValue } from '@/types/auth'
import { getAccountManageInfo, getAccountManageInfoRoles } from '@/api'

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated'; user: null }

const AuthContext = createContext<AuthContextValue | null>(null)

const fetchAuthState = async (): Promise<AuthState> => {
  const [{ data: info }, { data: roles }] = await Promise.all([
    getAccountManageInfo(),
    getAccountManageInfoRoles(),
  ])
  if (info && roles) {
    return { status: 'authenticated', user: { ...info, roles } }
  }
  return { status: 'unauthenticated', user: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })

  useEffect(() => {
    fetchAuthState()
      .then(setState)
      .catch(() => setState({ status: 'unauthenticated', user: null }))
  }, [])

  const refresh = async () => {
    setState(await fetchAuthState())
  }

  const logout = async () => {
    // /account/logout is not in the OpenAPI spec so we call it directly
    await fetch('/account/logout', { method: 'POST' }).catch(() => null)
    setState({ status: 'unauthenticated', user: null })
  }

  return (
    <AuthContext value={{ user: state.user, status: state.status, refresh, logout }}>
      {children}
    </AuthContext>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
