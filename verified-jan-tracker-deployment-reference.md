# verified-jan-tracker — Deployment Recovery Reference

## Repository
GitHub:
https://github.com/paulhugel/verified-jan-tracker

## Current Branch
main

## Latest Commits
- 15c67bb — Fix Vercel SSR configuration
- baf5f89 — Add explicit Vercel SSR routing configuration
- 5c4af75 — Configure TanStack Start for Vercel SSR
- 1f9ee32 — Fix TypeScript node typings for Vercel build
- b7c0a8b — Initial commit

---

# Current Known State

## Local build
Working successfully.

Current successful command:

```bash
npm run build
```

Produces:
- dist/client
- dist/server/server.js

No TypeScript failures remain.

---

# Current Deployment Problem

## Symptom
Vercel deployments fail immediately (~1 second).

## Most Likely Cause
`vercel.json` still contains unsupported runtime configuration:

```json
{
  "functions": {
    "dist/server/server.js": {
      "runtime": "nodejs22.x"
    }
  }
}
```

Vercel validates function paths before build output exists.

`dist/server/server.js` is generated later during build, so config parsing fails immediately.

---

# Required Next Fix

## Replace vercel.json with ONLY:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/client"
}
```

Remove:
- functions
- routes

TanStack Start + Nitro should manage SSR automatically.

---

# Files Added During Troubleshooting

## Current files
- app.config.ts
- nitro.config.ts
- vercel.json

## Note
These may still require cleanup later depending on SSR behavior after deployment succeeds.

---

# Important Observations

## DO NOT
- manually map routes in vercel.json
- manually target dist/server/server.js in Vercel functions config
- use tanstack-start build command (binary not installed)

## KEEP
Build command in package.json:

```json
"build": "vite build && tsc --noEmit"
```

---

# Convex Environment Variable

Configured in Vercel:
- VITE_CONVEX_URL

Current value used:
https://amicable-platypus-682.convex.cloud

---

# Remaining Verification Sequence

After fixing vercel.json:

1. git add vercel.json
2. git commit -m "Remove invalid Vercel functions config"
3. git push
4. wait for redeploy
5. verify:
   - no 404
   - homepage loads
   - Convex data loads

---

Generated for continuity from temporary ChatGPT thread.
