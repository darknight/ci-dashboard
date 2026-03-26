# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Actions CI Dashboard — a SvelteKit app that aggregates workflow status across multiple repos under the `darknight` GitHub org. Deployed to Cloudflare Workers via `@sveltejs/adapter-cloudflare`. Auth is handled externally by Cloudflare Access (no auth code in the app).

## Commands

- `pnpm dev` — start dev server (port 51730)
- `pnpm build` — production build (outputs to `.svelte-kit/cloudflare/`)
- `pnpm check` — run svelte-check for type checking
- `npx wrangler pages deploy` — deploy to Cloudflare

No test framework is configured.

## Architecture

**Data flow:** `+layout.server.ts` loads all repo data on every page via `getAllRepoDetails()` → passed to `+layout.svelte` which renders the full UI (sidebar + main content). `+page.svelte` is empty — all rendering happens in the layout.

**Server-side environment:** Config (`GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPOS`) is read via `$lib/server/env.ts`, which checks both `platform.env` (Cloudflare bindings) and `$env/dynamic/private` (local dev). `GITHUB_TOKEN` is a secret (not in `wrangler.toml`); `GITHUB_OWNER` and `GITHUB_REPOS` are set in `wrangler.toml` `[vars]`.

**GitHub API layer** (`$lib/github.ts`): Wraps GitHub REST API with in-memory cache (60s TTL). Exports types (`WorkflowRun`, `RepoDetail`, etc.) used throughout the app. Key functions: `getAllRepoDetails`, `triggerWorkflow`, `rerunFailedJobs`, `deriveHealth`.

**API routes:**
- `POST /api/trigger` — dispatch a workflow
- `POST /api/rerun` — rerun failed jobs
- `POST /api/refresh` — clear cache and invalidate
- `GET /api/poll/[repo]` — fetch fresh data for a single repo (used by auto-refresh)

**Auto-refresh polling** (`$lib/poll.svelte.ts`): When a workflow is `in_progress`/`queued`/`waiting`, the client-side poller hits `/api/poll/[repo]` every 15s. Stops automatically when runs complete. Uses Svelte 5 runes (`$state`).

**UI components:** shadcn-svelte primitives (Card, Badge, Button) in `$lib/components/ui/`. App-level components: `Sidebar`, `WorkflowCard`, `StatusBadge`, `StatusDot`.

## Key Patterns

- Svelte 5 runes syntax (`$state`, `$derived`, `$effect`, `$props`) — not legacy `let`/`$:` syntax
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no `tailwind.config` file)
- Monitored repos are configured in `wrangler.toml` `[vars].GITHUB_REPOS` as comma-separated string
