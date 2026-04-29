import type { GetAccountManageInfoResponse, GetAccountManageInfoRolesResponse } from "@/api"

export type User = GetAccountManageInfoResponse & { roles: GetAccountManageInfoRolesResponse }

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: User | null
  status: AuthStatus
  refresh: () => Promise<void>
  logout: () => Promise<void>
}
