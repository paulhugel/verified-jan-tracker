import { action, internalMutation, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const repoPayloadValidator = v.object({
  owner: v.string(),
  name: v.string(),
  url: v.string(),
  lastSyncedAt: v.string(),
});

const syncStatusPayloadValidator = v.object({
  name: v.string(),
  status: v.union(
    v.literal("idle"),
    v.literal("syncing"),
    v.literal("success"),
    v.literal("partial"),
    v.literal("failed"),
  ),
  message: v.string(),
  lastAttemptedAt: v.string(),
  lastSucceededAt: v.union(v.string(), v.null()),
  warningCount: v.number(),
});

const issuePayloadValidator = v.object({
  number: v.number(),
  title: v.string(),
  body: v.string(),
  state: v.string(),
  url: v.string(),
  matchedTerms: v.array(v.string()),
});

const commentPayloadValidator = v.object({
  issueNumber: v.number(),
  githubId: v.number(),
  author: v.string(),
  authorUrl: v.string(),
  body: v.string(),
  url: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  authorAssociation: v.string(),
});

const pullRequestPayloadValidator = v.object({
  issueNumber: v.number(),
  number: v.number(),
  title: v.string(),
  url: v.string(),
  state: v.string(),
});

const nightlyManifestValidator = v.object({
  version: v.string(),
  pubDate: v.string(),
  appleSiliconUrl: v.union(v.string(), v.null()),
});

type GithubIssue = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  pull_request?: unknown;
};

type GithubComment = {
  id: number;
  body: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  author_association: string;
  user: {
    login: string;
    html_url: string;
  } | null;
};

type GithubTimelineEvent = {
  source?: {
    issue?: {
      number?: number;
      title?: string;
      html_url?: string;
      state?: string;
      pull_request?: unknown;
    };
  };
};

type SyncWarning = {
  scope: string;
  message: string;
};

const SYNC_STATUS_NAME = "github_jan_apple_silicon";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const VERIFIED_SNAPSHOT = {
  repo: {
    owner: "janhq",
    name: "jan",
    url: "https://github.com/janhq/jan",
  },
  issues: [
    {
      number: 7968,
      title: "bug: Error trying to run any MLX model",
      body:
        "Error when I try to use any MLX model, for example Jan-v2-VL-high-4bit-mlx. The report says this happens on macOS using a MacBook Pro M5 Pro and the MLX model process exits unexpectedly.",
      state: "open",
      url: "https://github.com/janhq/jan/issues/7968",
      matchedTerms: ["M5", "MLX"],
    },
    {
      number: 7804,
      title:
        "bug: MLX models fail to load in 0.7.9 on macOS Apple Silicon (Failed to load the default metallib), but work in 0.7.8",
      body:
        "The report says MLX models fail to load on macOS Apple Silicon on a Mac mini M4 in Jan 0.7.9. The error shown is 'MLX error: Failed to load the default metallib. library not found', while the same model worked in Jan 0.7.8.",
      state: "open",
      url: "https://github.com/janhq/jan/issues/7804",
      matchedTerms: ["Apple Silicon", "metallib", "M4", "MLX"],
    },
    {
      number: 7722,
      title: "bug: Qwen3.5-9B-MLX-4bit not working",
      body:
        "This report says the Qwen3.5-9B-MLX-4bit model cannot be used in Jan. The MLX server starts, then fails with unsupportedModelType('qwen3_5').",
      state: "open",
      url: "https://github.com/janhq/jan/issues/7722",
      matchedTerms: ["MLX"],
    },
    {
      number: 7608,
      title: "Model import for MLX not possible",
      body:
        "The report says that in Jan 0.7.7 on macOS 26.3, the Open button is not active for importing an MLX model unless a safetensor file is selected.",
      state: "open",
      url: "https://github.com/janhq/jan/issues/7608",
      matchedTerms: ["MLX"],
    },
    {
      number: 7558,
      title: "bug:  MLX in latest version 0.7.7 Broken and can not get it to work.",
      body:
        "The report says MLX support in Jan 0.7.7 is broken for a Mac user after downloading an MLX model from Hugging Face.",
      state: "open",
      url: "https://github.com/janhq/jan/issues/7558",
      matchedTerms: ["MLX"],
    },
    {
      number: 6972,
      title: "bug: Jan-v2-VL — Model Features Missing After Download (Vision + Proactive Not Loaded)",
      body:
        "The issue lists backend build B6929 / macos-arm64 and platform macOS (Apple Silicon). It reports Jan-v2-VL model features missing after download.",
      state: "open",
      url: "https://github.com/janhq/jan/issues/6972",
      matchedTerms: ["Apple Silicon", "macos-arm64"],
    },
    {
      number: 6971,
      title:
        "bug: Jan v0.72 → v0.73 Regression — Local API Server Fails to Start + llama.cpp Model Fails to Initialize (Apple M4)",
      body:
        "The report says the regression blocks local model execution on Apple Silicon. The system section lists Apple M4, macOS Tahoe 26.1, and llama.cpp backend build B6929 / macos-arm64.",
      state: "open",
      url: "https://github.com/janhq/jan/issues/6971",
      matchedTerms: ["Apple Silicon", "macos-arm64", "M4"],
    },
  ],
} as const;

const directTermMatchers: Array<{ label: string; pattern: RegExp }> = [
  { label: "Apple Silicon", pattern: /apple silicon/i },
  { label: "macos-arm64", pattern: /macos-arm64/i },
  { label: "metallib", pattern: /metallib/i },
  { label: "M1", pattern: /\bm1\b/i },
  { label: "M2", pattern: /\bm2\b/i },
  { label: "M3", pattern: /\bm3\b/i },
  { label: "M4", pattern: /\bm4\b/i },
  { label: "M5", pattern: /\bm5\b/i },
];

const mlxMatcher = /\bmlx\b/i;
const appleContextMatcher = /\bmac\b|\bmacos\b|apple|macbook|mac mini|mac studio|\/Applications\/Jan\.app\/Contents/i;
const nonAppleContextMatcher = /windows|manjaro|linux|nvidia|cuda/i;

function dedupe(values: Array<string>): Array<string> {
  return [...new Set(values)];
}

function classifyIssue(issue: GithubIssue): { matchedTerms: Array<string> } | null {
  const text = `${issue.title}\n${issue.body ?? ""}`;
  const directTerms = directTermMatchers
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);

  if (directTerms.length > 0) {
    return {
      matchedTerms: dedupe([...directTerms, ...(mlxMatcher.test(text) ? ["MLX"] : [])]),
    };
  }

  if (
    mlxMatcher.test(text) &&
    appleContextMatcher.test(text) &&
    !nonAppleContextMatcher.test(text)
  ) {
    return {
      matchedTerms: ["MLX"],
    };
  }

  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGithubJson(url: string, accept = "application/vnd.github+json"): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: accept,
        "User-Agent": "cto-new-verified-jan-tracker",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(process.env.GITHUB_TOKEN
          ? {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }
          : {}),
      },
    });

    if (response.ok) {
      return await response.json();
    }

    const shouldRetry = response.status === 403 || response.status === 429 || response.status >= 500;
    lastError = new Error(`GitHub request failed (${response.status}) for ${url}`);

    if (!shouldRetry || attempt === MAX_RETRIES) {
      throw lastError;
    }

    await wait(BASE_DELAY_MS * 2 ** (attempt - 1));
  }

  throw lastError ?? new Error(`GitHub request failed for ${url}`);
}

async function updateSyncStatus(
  ctx: { runMutation: (ref: typeof internal.github.upsertSyncStatus, args: { syncStatus: { name: string; status: "idle" | "syncing" | "success" | "partial" | "failed"; message: string; lastAttemptedAt: string; lastSucceededAt: string | null; warningCount: number; }; }) => Promise<null> },
  syncStatus: {
    name: string;
    status: "idle" | "syncing" | "success" | "partial" | "failed";
    message: string;
    lastAttemptedAt: string;
    lastSucceededAt: string | null;
    warningCount: number;
  },
) {
  await ctx.runMutation(internal.github.upsertSyncStatus, { syncStatus });
}

export const getNightlyManifest = action({
  args: {},
  returns: nightlyManifestValidator,
  handler: async () => {
    const response = await fetch("https://delta.jan.ai/nightly/latest.json");
    if (!response.ok) {
      throw new Error(`Nightly manifest request failed (${response.status})`);
    }

    const manifest = (await response.json()) as {
      version?: string;
      pub_date?: string;
      platforms?: Record<string, { url?: string }>;
    };

    return {
      version: manifest.version ?? "unknown",
      pubDate: manifest.pub_date ?? "",
      appleSiliconUrl: manifest.platforms?.["darwin-aarch64"]?.url ?? null,
    };
  },
});

export const syncJanAppleSiliconIssues = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const startedAt = new Date().toISOString();

    await updateSyncStatus(ctx, {
      name: SYNC_STATUS_NAME,
      status: "syncing",
      message: "Sync in progress.",
      lastAttemptedAt: startedAt,
      lastSucceededAt: null,
      warningCount: 0,
    });

    try {
      const repoResponse = await fetchGithubJson("https://api.github.com/repos/janhq/jan");
      const syncedAt = new Date().toISOString();

      const openIssues: Array<GithubIssue> = [];
      let page = 1;

      while (true) {
        const pageResponse = (await fetchGithubJson(
          `https://api.github.com/repos/janhq/jan/issues?state=open&per_page=100&page=${page}`,
        )) as Array<GithubIssue>;

        const issuesOnly = pageResponse.filter((issue) => !issue.pull_request);
        openIssues.push(...issuesOnly);

        if (pageResponse.length < 100) {
          break;
        }

        page += 1;
      }

      const trackedIssues = openIssues
        .map((issue) => {
          const classified = classifyIssue(issue);
          if (!classified) {
            return null;
          }

          return {
            number: issue.number,
            title: issue.title,
            body: issue.body ?? "",
            state: issue.state,
            url: issue.html_url,
            matchedTerms: classified.matchedTerms,
          };
        })
        .filter(
          (
            issue,
          ): issue is {
            number: number;
            title: string;
            body: string;
            state: string;
            url: string;
            matchedTerms: Array<string>;
          } => issue !== null,
        )
        .sort((a, b) => b.number - a.number);

      const comments: Array<{
        issueNumber: number;
        githubId: number;
        author: string;
        authorUrl: string;
        body: string;
        url: string;
        createdAt: string;
        updatedAt: string;
        authorAssociation: string;
      }> = [];

      const pullRequests: Array<{
        issueNumber: number;
        number: number;
        title: string;
        url: string;
        state: string;
      }> = [];

      const warnings: Array<SyncWarning> = [];

      for (const issue of trackedIssues) {
        try {
          const githubComments = (await fetchGithubJson(
            `https://api.github.com/repos/janhq/jan/issues/${issue.number}/comments?per_page=20&sort=updated&direction=desc`,
          )) as Array<GithubComment>;

          for (const comment of githubComments) {
            comments.push({
              issueNumber: issue.number,
              githubId: comment.id,
              author: comment.user?.login ?? "unknown",
              authorUrl: comment.user?.html_url ?? issue.url,
              body: comment.body ?? "",
              url: comment.html_url,
              createdAt: comment.created_at,
              updatedAt: comment.updated_at,
              authorAssociation: comment.author_association,
            });
          }
        } catch (error) {
          warnings.push({
            scope: `comments:${issue.number}`,
            message: error instanceof Error ? error.message : `Comment sync failed for #${issue.number}`,
          });
        }

        try {
          const timelineEvents = (await fetchGithubJson(
            `https://api.github.com/repos/janhq/jan/issues/${issue.number}/timeline?per_page=100`,
          )) as Array<GithubTimelineEvent>;

          const pullRequestMap: Record<number, { number: number; title: string; url: string; state: string }> = {};

          for (const event of timelineEvents) {
            const sourceIssue = event.source?.issue;
            if (!sourceIssue?.pull_request || !sourceIssue.number || !sourceIssue.html_url || !sourceIssue.title) {
              continue;
            }

            pullRequestMap[sourceIssue.number] = {
              number: sourceIssue.number,
              title: sourceIssue.title,
              url: sourceIssue.html_url,
              state: sourceIssue.state ?? "open",
            };
          }

          for (const pullRequest of Object.values(pullRequestMap)) {
            pullRequests.push({
              issueNumber: issue.number,
              number: pullRequest.number,
              title: pullRequest.title,
              url: pullRequest.url,
              state: pullRequest.state,
            });
          }
        } catch (error) {
          warnings.push({
            scope: `timeline:${issue.number}`,
            message: error instanceof Error ? error.message : `Timeline sync failed for #${issue.number}`,
          });
        }
      }

      await ctx.runMutation(internal.github.replaceTrackedData, {
        repo: {
          owner: repoResponse.owner.login,
          name: repoResponse.name,
          url: repoResponse.html_url,
          lastSyncedAt: syncedAt,
        },
        issues: trackedIssues,
        comments,
        pullRequests,
      });

      await updateSyncStatus(ctx, {
        name: SYNC_STATUS_NAME,
        status: warnings.length > 0 ? "partial" : "success",
        message:
          warnings.length > 0
            ? `Synced ${trackedIssues.length} issues with ${warnings.length} warning(s).`
            : `Synced ${trackedIssues.length} issues successfully.`,
        lastAttemptedAt: syncedAt,
        lastSucceededAt: syncedAt,
        warningCount: warnings.length,
      });

      return null;
    } catch (error) {
      const failedAt = new Date().toISOString();
      await updateSyncStatus(ctx, {
        name: SYNC_STATUS_NAME,
        status: "failed",
        message: error instanceof Error ? error.message : "GitHub sync failed.",
        lastAttemptedAt: failedAt,
        lastSucceededAt: null,
        warningCount: 0,
      });
      throw error;
    }
  },
});

export const loadVerifiedSnapshot = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const loadedAt = new Date().toISOString();
    await ctx.runMutation(internal.github.replaceTrackedData, {
      repo: {
        ...VERIFIED_SNAPSHOT.repo,
        lastSyncedAt: loadedAt,
      },
      issues: VERIFIED_SNAPSHOT.issues.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        url: issue.url,
        matchedTerms: [...issue.matchedTerms],
      })),
      comments: [],
      pullRequests: [],
    });
    await ctx.runMutation(internal.github.upsertSyncStatus, {
      syncStatus: {
        name: SYNC_STATUS_NAME,
        status: "idle",
        message: "Loaded verified snapshot fallback.",
        lastAttemptedAt: loadedAt,
        lastSucceededAt: loadedAt,
        warningCount: 0,
      },
    });
    return null;
  },
});

export const replaceTrackedData = internalMutation({
  args: {
    repo: repoPayloadValidator,
    issues: v.array(issuePayloadValidator),
    comments: v.array(commentPayloadValidator),
    pullRequests: v.array(pullRequestPayloadValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const comment of await ctx.db.query("comments").collect()) {
      await ctx.db.delete(comment._id);
    }
    for (const pullRequest of await ctx.db.query("pullRequests").collect()) {
      await ctx.db.delete(pullRequest._id);
    }
    for (const issue of await ctx.db.query("issues").collect()) {
      await ctx.db.delete(issue._id);
    }
    for (const repo of await ctx.db.query("repos").collect()) {
      await ctx.db.delete(repo._id);
    }

    const repoId = await ctx.db.insert("repos", args.repo);
    const issueNumberToId: Record<number, Id<"issues">> = {};

    for (const issue of args.issues) {
      const issueId = await ctx.db.insert("issues", {
        repoId,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        url: issue.url,
        matchedTerms: issue.matchedTerms,
      });
      issueNumberToId[issue.number] = issueId;
    }

    for (const comment of args.comments) {
      const issueId = issueNumberToId[comment.issueNumber];
      if (!issueId) continue;

      await ctx.db.insert("comments", {
        issueId,
        githubId: comment.githubId,
        author: comment.author,
        authorUrl: comment.authorUrl,
        body: comment.body,
        url: comment.url,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorAssociation: comment.authorAssociation,
      });
    }

    for (const pullRequest of args.pullRequests) {
      const issueId = issueNumberToId[pullRequest.issueNumber];
      if (!issueId) continue;

      await ctx.db.insert("pullRequests", {
        issueId,
        number: pullRequest.number,
        title: pullRequest.title,
        url: pullRequest.url,
        state: pullRequest.state,
      });
    }

    return null;
  },
});

export const upsertSyncStatus = internalMutation({
  args: { syncStatus: syncStatusPayloadValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("syncStatus")
      .withIndex("by_name", (q) => q.eq("name", args.syncStatus.name))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args.syncStatus);
    } else {
      await ctx.db.insert("syncStatus", args.syncStatus);
    }

    return null;
  },
});
