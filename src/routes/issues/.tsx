import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { type Id } from 'convex/_generated/dataModel'

export const Route = createFileRoute('/issues/$issueId')({
  component: IssuePage,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Unable to load issue</h2>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Back to tracker
        </Link>
      </div>
    </div>
  ),
})

function IssuePage() {
  const { issueId } = Route.useParams()
  const { data } = useSuspenseQuery(
    convexQuery(api.repos.getIssue, { issueId: issueId as Id<'issues'> }),
  )

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Issue not found</h1>
          <p className="mt-2 text-sm text-slate-600">This issue is not present in the tracker.</p>
          <Link to="/" className="mt-6 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Back to tracker
          </Link>
        </div>
      </div>
    )
  }

  const { issue, repo, comments, pullRequests } = data

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to tracker
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              {repo.owner}/{repo.name}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">#{issue.number}</span>
            {issue.matchedTerms.map((term) => (
              <span key={term} className={`rounded-full px-2.5 py-1 ${badgeClassName(term)}`}>
                {term}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900">{issue.title}</h1>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <p className="mb-3 font-semibold text-slate-900">Why this issue is tracked</p>
            <p>It matched the combined Apple Silicon rule through: {issue.matchedTerms.join(', ')}.</p>
          </div>

          <div className="prose prose-slate mt-8 max-w-none">
            <div className="whitespace-pre-wrap text-slate-700">{issue.body}</div>
          </div>

          <a
            href={issue.url}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Open on GitHub
          </a>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Linked pull requests</h2>
            <div className="text-sm font-semibold text-slate-500">{pullRequests.length}</div>
          </div>

          {pullRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No linked pull requests were found in the synced GitHub timeline for this issue.
            </div>
          ) : (
            <div className="space-y-3">
              {pullRequests.map((pullRequest) => (
                <a
                  key={pullRequest._id}
                  href={pullRequest.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">PR #{pullRequest.number}</span>
                    <span className={`rounded-full px-2.5 py-1 ${pullRequest.state === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {pullRequest.state}
                    </span>
                  </div>
                  <div className="mt-2 text-base font-bold text-slate-900">{pullRequest.title}</div>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Recent contributor comments</h2>
            <div className="text-sm font-semibold text-slate-500">{comments.length}</div>
          </div>

          {comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No comments have been synced for this issue yet.
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <article key={comment._id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <a href={comment.authorUrl} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:text-slate-700">
                      {comment.author}
                    </a>
                    <span>•</span>
                    <span>{comment.authorAssociation}</span>
                    <span>•</span>
                    <span>{formatDateTime(comment.updatedAt)}</span>
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{comment.body || 'No comment text provided.'}</div>
                  <a
                    href={comment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-semibold text-slate-700 hover:text-slate-900"
                  >
                    View comment on GitHub
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function badgeClassName(term: string) {
  if (term === 'MLX') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (/^M\d$/i.test(term)) {
    return 'bg-violet-100 text-violet-700'
  }
  if (term === 'macos-arm64') {
    return 'bg-sky-100 text-sky-700'
  }
  if (term === 'Apple Silicon' || term === 'metallib') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-slate-100 text-slate-700'
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
