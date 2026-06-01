import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data } = useQuery(convexQuery(api.repos.getDashboard, {}))

  const safeData = data ?? {
    repo: null,
    issues: [],
    syncStatus: null,
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Verified Jan Tracker</h1>
          </div>
          <p className="mt-3 text-lg font-medium text-slate-600">
            Monitoring Apple Silicon & MLX regressions for Jan.
          </p>
        </header>

        {/* Critical Fixes & Workarounds */}
        <section className="mb-12 rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-900">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <h2 className="text-xl font-black text-slate-900">Critical Workarounds & Fixes</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm md:col-span-2">
              <h3 className="mb-3 font-bold text-slate-900 text-sm uppercase tracking-wide">
                Jan 0.8.1 Apple Silicon Status
              </h3>
              <p className="text-sm leading-relaxed text-slate-700">
                <span className="font-semibold text-slate-900">Jan Version 0.8.1</span>{' '}
                for Apple Silicon MLX support is currently experimental. Embeddings are
                unavailable, the reasoning toggle is not yet wired through, and some newer
                model architectures may fail to load. Report issues on GitHub so they can
                be prioritized and tracked.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-bold text-slate-900 text-sm uppercase tracking-wide">Jan GitHub Repository</h3>
              <p className="text-sm leading-relaxed text-slate-700">
                <a
                  className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
                  href="https://github.com/janhq/jan"
                  target="_blank"
                  rel="noreferrer"
                >
                  janhq/jan
                </a>
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-bold text-slate-900 text-sm uppercase tracking-wide">System Status</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${safeData.syncStatus?.status === 'success' || safeData.syncStatus?.status === 'idle' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <p className="text-slate-700">
                  {safeData.syncStatus?.message ?? 'Sync status unknown'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Tracked Issues</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Verified regressions and high-priority Apple Silicon bugs.
            </p>
          </div>
          <div className="rounded-xl bg-slate-200 px-3 py-1 text-sm font-bold text-slate-700">
            {safeData.issues.length}
          </div>
        </section>

        <IssueSection issues={safeData.issues} />
      </div>
    </main>
  )
}

function IssueSection({ issues }: { issues: any[] }) {
  return (
    <div className="grid gap-4">
      {issues.map((issue: any) => (
        <Link
          key={issue._id}
          to="/issues/$issueId"
          params={{ issueId: issue._id }}
          className="group block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                {issue.matchedTerms.map((term: string) => (
                  <span key={term} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {term}
                  </span>
                ))}
              </div>
              <h3 className="text-lg font-bold leading-snug text-slate-900 group-hover:text-slate-700">
                {issue.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {issue.body}
              </p>
            </div>
            <div className="text-slate-300 transition group-hover:text-slate-900">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
