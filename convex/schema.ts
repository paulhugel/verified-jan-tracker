import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  repos: defineTable({
    owner: v.string(),
    name: v.string(),
    url: v.string(),
    lastSyncedAt: v.string(),
  }).index("by_owner_and_name", ["owner", "name"]),

  syncStatus: defineTable({
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
  }).index("by_name", ["name"]),

  issues: defineTable({
    repoId: v.id("repos"),
    number: v.number(),
    title: v.string(),
    body: v.string(),
    state: v.string(),
    url: v.string(),
    matchedTerms: v.array(v.string()),
  })
    .index("by_repo_and_number", ["repoId", "number"])
    .index("by_repo_and_state", ["repoId", "state"]),

  comments: defineTable({
    issueId: v.id("issues"),
    githubId: v.number(),
    author: v.string(),
    authorUrl: v.string(),
    body: v.string(),
    url: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    authorAssociation: v.string(),
  })
    .index("by_issue_and_createdAt", ["issueId", "createdAt"])
    .index("by_issue_and_githubId", ["issueId", "githubId"]),

  pullRequests: defineTable({
    issueId: v.id("issues"),
    number: v.number(),
    title: v.string(),
    url: v.string(),
    state: v.string(),
  }).index("by_issue_and_number", ["issueId", "number"]),
});
