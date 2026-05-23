import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  Link,
} from '@tanstack/react-router'
import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '~/styles/app.css?url'
import { useAction } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useState } from 'react'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Verified Jan Apple Silicon Issues' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  const syncGithub = useAction(api.github.syncJanAppleSiliconIssues)
  const [isLoading, setIsLoading] = useState(false)

  const handleLoad = async () => {
    setIsLoading(true)
    try {
      await syncGithub({})
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <RootDocument>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
              J
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Verified Jan tracker</div>
              <div className="text-xs text-slate-500">Auto-syncs Jan Apple Silicon and MLX issues from GitHub</div>
            </div>
          </Link>

          <button
            onClick={handleLoad}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <svg
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15"
              />
            </svg>
            {isLoading ? 'Syncing…' : 'Sync GitHub now'}
          </button>
        </div>
      </header>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
