import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const repoValidator = v.object({
  _id: v.id("repos"),
  _creationTime: v.number(),
  owner: v.string(),
  name: v.string(),
  url: v.string(),
  lastSyncedAt: v.string(),
});

const syncStatusValidator = v.object({
  _id: v.id("syncStatus"),
  _creationTime: v.number(),
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

const issueValidator = v.object({
  _id: v.id("issues"),
  _creationTime: v.number(),
  repoId: v.id("repos"),
  number: v.number(),
  title: v.string(),
  body: v.string(),
  state: v.string(),
  url: v.string(),
  matchedTerms: v.array(v.string()),
});

const commentValidator = v.object({
  _id: v.id("comments"),
  _creationTime: v.number(),
  issueId: v.id("issues"),
  githubId: v.number(),
  author: v.string(),
  authorUrl: v.string(),
  body: v.string(),
  url: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  authorAssociation: v.string(),
});

const pullRequestValidator = v.object({
  _id: v.id("pullRequests"),
  _creationTime: v.number(),
  issueId: v.id("issues"),
  number: v.number(),
  title: v.string(),
  url: v.string(),
  state: v.string(),
});

export const getDashboard = query({
  args: {},
  returns: v.object({
    repo: v.union(v.null(), repoValidator),
    syncStatus: v.union(v.null(), syncStatusValidator),
    issues: v.array(issueValidator),
  }),
  handler: async (ctx) => {
    const repo = await ctx.db
      .query("repos")
      .withIndex("by_owner_and_name", (q) => q.eq("owner", "janhq").eq("name", "jan"))
      .unique();

    const syncStatus = await ctx.db
      .query("syncStatus")
      .withIndex("by_name", (q) => q.eq("name", "github_jan_apple_silicon"))
      .unique();

    if (!repo) {
      return { repo: null, syncStatus, issues: [] };
    }

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_repo_and_state", (q) => q.eq("repoId", repo._id).eq("state", "open"))
      .collect();

    return {
      repo,
      syncStatus,
      issues: issues.sort((a, b) => b.number - a.number),
    };
  },
});

export const getIssue = query({
  args: { issueId: v.id("issues") },
  returns: v.union(
    v.null(),
    v.object({
      issue: issueValidator,
      repo: repoValidator,
      comments: v.array(commentValidator),
      pullRequests: v.array(pullRequestValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return null;

    const repo = await ctx.db.get(issue.repoId);
    if (!repo) throw new Error("Repository not found for issue.");

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_issue_and_createdAt", (q) => q.eq("issueId", args.issueId))
      .order("desc")
      .take(20);

    const pullRequests = await ctx.db
      .query("pullRequests")
      .withIndex("by_issue_and_number", (q) => q.eq("issueId", args.issueId))
      .collect();

    return {
      issue,
      repo,
      comments,
      pullRequests: pullRequests.sort((a, b) => b.number - a.number),
    };
  },
});

export const clearAllData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
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
    for (const syncStatus of await ctx.db.query("syncStatus").collect()) {
      await ctx.db.delete(syncStatus._id);
    }
    return null;
  },
});
