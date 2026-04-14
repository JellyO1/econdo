import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import type { AuthContextValue } from './types/auth'

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined! as AuthContextValue,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
