import { ConvexReactClient, ConvexProvider } from 'convex/react'
import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

  if (!CONVEX_URL) {
    throw new Error('Missing VITE_CONVEX_URL')
  }

  // ✅ SINGLE SOURCE OF TRUTH
  const convex = new ConvexReactClient(CONVEX_URL)

  const convexQueryClient = new ConvexQueryClient(convex)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })

  convexQueryClient.connect(queryClient)

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      context: { queryClient },
      defaultPreload: 'intent',
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
      defaultNotFoundComponent: () => <p>not found</p>,

      // ✅ FIXED PROVIDER
      Wrap: ({ children }) => (
        <ConvexProvider client={convex}>
          {children}
        </ConvexProvider>
      ),
    }),
    queryClient,
  )

  return router
}
