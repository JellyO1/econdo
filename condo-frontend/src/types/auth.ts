import type { PostAccountManageInfoResponse } from "@/api"

export type User = PostAccountManageInfoResponse;

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: User | null
  status: AuthStatus
  refresh: () => Promise<void>
  logout: () => Promise<void>
}
