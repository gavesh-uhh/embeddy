# Embeddy — Full Audit & Improvement Plan

> Audit date: Aug 23, 2026 · Scope: entire repo (src/, api/, rules, config, infra)

Embeddy is a Next.js 14 App Router app where ~8 parallel Gemini-powered agents turn a project description (+ optional datasheet PDFs) into an embedded design package: overview, pin diagram, Konva schematic, fatal issues, compatibility checks, power budget, BOM (LKR), and firmware skeleton. Auth is Firebase (email + Google), storage is Firestore with a localStorage mirror.

---

## Part 1 — Audit Findings

Severity legend: 🔴 critical · 🟠 high · 🟡 medium · ⚪ low

### 1.1 Security

| # | Sev | Finding | Location |
|---|-----|---------|----------|
| S1 | 🔴 | **Firestore rule allows public read of every project.** `allow read: if true` means anyone can read any user's projects if they learn/guess an ID, and enables enumeration. | `firestore.rules:6` |
| S2 | 🔴 | **AI endpoints have no authentication and no rate limiting.** `/api/agents/[agent]` and `/api/project/create` accept anonymous traffic → free unlimited use of your Gemini quota (cost attack). | `api/agents/[agent]/route.ts`, `api/project/create/route.ts` |
| S3 | 🟠 | **In-memory rate limiting is useless on serverless.** A module-level `Map` resets per lambda instance; also keyed by spoofable `x-forwarded-for`. Only `/api/natural-language` has it at all. | `api/natural-language/route.ts:7-59` |
| S4 | 🟠 | **No server-side input validation.** Raw `body.projectContext` trusted; `board` cast blindly; no caps on `fileContents` payload size; arbitrary JSON from `migrateLocalStorage` pushed straight to Firestore. | all API routes, `migrateLocalStorage.ts:16-36` |
| S5 | 🟠 | **Open redirect** in login: `?next=` is used unvalidated (`//evil.com` works). Register ignores `next` entirely (loses destination across login↔register round-trip). | `auth/login/page.tsx:28,59`, `auth/register/page.tsx:51,85` |
| S6 | 🟠 | **Route-guard whitelist bug:** `PUBLIC_ROUTES` contains `"/project"` and matching uses `startsWith(r + "/")` → every `/project/<id>` page is treated as public; signed-out users are never redirected. | `AuthContext.tsx:25,38` |
| S7 | 🟡 | **Prompt injection surface:** user description and PDF/file contents are interpolated directly into prompts with no delimiting/escaping; a crafted datasheet could hijack agents. Truncation exists (3000 chars/doc) but no total budget. | `ProjectOverviewAgent.ts`, all agents |
| S8 | 🟡 | Error fallback leaks dev advice to end users ("Check your Firebase config in .env"). | `auth/login/page.tsx:69`, `register:95` |
| S9 | 🟡 | No `middleware.ts`; route protection lives only in a client effect. No CSRF consideration (JSON POSTs, cookie-less — acceptable now, but token-auth will need care). | repo root |
| S10 | ⚪ | `.env.local` correctly gitignored and untracked ✔ (verified). No secrets in repo ✔. | — |

### 1.2 Correctness bugs

| # | Sev | Finding | Location |
|---|-----|---------|----------|
| B1 | 🔴 | **localStorage-first caching shadows the cloud forever.** `loadProject` returns the cached copy and never queries Firestore if a local copy exists — no `updatedAt` comparison, no TTL. Cloud edits made anywhere else never appear. | `projectStore.ts:37-39` |
| B2 | 🔴 | **Konva schematic deselect is broken.** Click handler reads `selectedId` captured at init time (closure never updated), so you can never deselect by clicking again; clicking background doesn't clear selection either. | `CircuitRenderer.tsx:435-436,488-489` |
| B3 | 🟠 | **Lost-update races on the project object.** `handleRetry` and the NL editor both do read-modify-write of the whole `project` from possibly-stale closures, then persist; retries are re-clickable while in flight (parallel requests clobber each other). One retry path mutates `updated.errors` nested object directly. | `project/[id]/page.tsx:123-141`, `NaturalLanguageEditor.tsx:166,387-405` |
| B4 | 🟠 | **Undo/redo don't persist.** Only `onProjectUpdate` fires — reload resurrects pre-undo state. Ctrl+Z inside the chat input is hijacked away from native text undo. | `NaturalLanguageEditor.tsx:430-433,477,501` |
| B5 | 🟠 | **Silent failure everywhere.** Bare `catch {}` on retry (user gets zero feedback), on delete (project "resurrects" later since cloud delete failed), on migration. `cloudStatus` shows "Cloud Synced" even when `listProjects` fell back to localStorage. Network outage renders as "Project not found". | `page.tsx:142,231,204-206`, `projectStore.ts:73-89`, `page.tsx:212` |
| B6 | 🟠 | **NL-editor ops are partially implemented.** `explain_design`, `suggest_improvements`, `optimize_power`, `check_compatibility` are silent no-ops — yet three of them are the app's own suggested quick commands. Ops are dropped entirely whenever the model asks clarifying questions. `modify_pin` leaves `boardPin` stale; `change_board` casts an arbitrary string to `BoardType` unvalidated. Downstream agent failures inside NL edit are swallowed. | `NaturalLanguageEditor.tsx:140,209-228,253-257,382-390` |
| B7 | 🟠 | **Konva lifecycle leaks.** Rapid schematic changes interleave across the dynamic `import("konva")` boundary and orphan stages; `document.body.style.cursor` stays `"pointer"` if unmount happens mid-hover; no `ResizeObserver`, so canvas breaks on window resize. | `CircuitRenderer.tsx:201,469-470,206-207` |
| B8 | 🟡 | **Hydration mismatch:** `SkeletonLoader` uses `Math.random()` widths during SSR. | `SkeletonLoader.tsx:15` |
| B9 | 🟡 | Inconsistent agent invocation: create-route calls `CodeSkeletonAgent` without language/framework; agents-route passes them. Field-mapping miss in retry discards fetched results silently. | `api/project/create/route.ts:78`, `project/[id]/page.tsx:124-131` |
| B10 | 🟡 | `AuthContext` effect re-subscribes the Firebase listener on every pathname change. Anonymous submissions possible after mid-form sign-out (form view performs no user check). | `AuthContext.tsx:44`, `app/page.tsx:266-297` |
| B11 | 🟡 | File handling UX bugs: duplicate filter logic in change/drop handlers, rejected files dropped silently, input value not cleared (re-selecting same file is a no-op), form/files never reset after submit, `loading` recovery depends entirely on navigation. | `app/page.tsx:237-256,274-292` |
| B12 | ⚪ | `FatalIssuesPanel` `[LOG_0x0{i}]` hex formatting breaks past index 9; highlight.js "already highlighted" warnings from re-highlighting persistent nodes; PowerBudgetPanel mixes two normalization scales (max vs fixed 500mA). | panels |

### 1.3 LLM pipeline quality

| # | Sev | Finding |
|---|-----|---------|
| A1 | 🟠 | `generateJSON` is `JSON.parse(cleaned) as T` — no runtime schema validation, no retry/backoff, no temperature/token config, no timeout. Model name hardcoded (`gemini-3.1-flash-lite`). Fence-stripping regexes are fragile. (`lib/gemini.ts`) |
| A2 | 🟠 | Prompts rely on a single few-shot example + prose schema descriptions. Should use Gemini's native structured output (`responseMimeType: application/json` + `responseSchema`). |
| A3 | 🟡 | Orchestration duplicated 3 ways: `create` route, `agents/[agent]` route, and NL editor's downstream regeneration each hand-wire agent calls with subtly different args/error handling. |
| A4 | 🟡 | No prompt-injection defenses (S7), no output sanity checks (e.g., pins referencing boards' real GPIO maps, negative currents in power budget). |
| A5 | 🟡 | Whole-project creation is a single blocking 30–60s POST with no progress feedback, no cancellation (`AbortController`), and no per-section retry other than the panel-level button. |

### 1.4 Frontend architecture & performance

- 🔴 `src/app/page.tsx` is **1,521 lines / 62KB** — two full page trees (landing + new-project form) inline, 14 `useState`, zero extracted components, ships as one giant client bundle. Marketing content isn't server-rendered.
- 🟠 No memoization anywhere; typing in the features-modal search re-renders the entire landing tree.
- 🟠 ~30 hover effects implemented via imperative `onMouseEnter/onMouseLeave` style mutation instead of CSS — desyncs on re-render, invisible to keyboard users.
- 🟠 Hardcoded color literals (`#00ff66`, `rgba(0,255,102,…)` sprinkled across 8+ files) instead of design tokens; panel shell (error+skeleton states) copy-pasted 7×; Google button/auth input styles duplicated between login/register.
- 🟡 Hero LCP image lacks `priority`/`sizes`; fullscreen `backdropFilter: blur(12px)`; pdfjs worker configured twice incl. an eager module-level import pulling the chunk unnecessarily; `reactStrictMode: false` globally just for Konva (masks real bugs).
- 🟡 No React error boundary anywhere; no `role="alert"` on error boxes.

### 1.5 Accessibility

- 🟠 Dialogs/modals lack `role="dialog"`, focus traps, Escape-to-close, focus restore (features modal, user menu, NL editor panel). Chat region lacks `aria-live`.
- 🟠 `<div onClick>` used as buttons (drop zone, feature cards, menu overlay) — no keyboard access. Board selector conveys selection by border color only.
- 🟡 Color-only status signaling throughout panels; no `prefers-reduced-motion` guards; unlabeled icon buttons; raw Markdown asterisks leaking into visible copy (`**ESP32**`).
- ✅ Pricing page is notably better; auth labels are wired correctly.

### 1.6 Data layer

- 🟠 Dual persistence (localStorage + Firestore) with last-write-wins, no schema versioning, no conflict detection, multi-tab unsafe. Migration never deletes migrated keys → stale local copies win forever + wasted reads every visit.
- 🟡 `deleteProject` deletes locally first, cloud best-effort → resurrection bug. Share button copies URL that requires same auth/device state → dead-end UX given B1.
- 🟡 `errors: Record<string,string>` per-section is decent, but there's no "regenerate failed section" affordance beyond the retry button, and no aggregate health indicator that's truthful.

### 1.7 Infrastructure / process gaps

| # | Sev | Gap |
|---|-----|-----|
| I1 | 🔴 | **Zero tests** (0 test files, no framework installed). |
| I2 | 🟠 | **No CI/CD** (no `.github/`), no Dependabot/Renovate. |
| I3 | 🟠 | **Dirty worktree:** PCB feature deletion (4 files) + edits to 12 core files uncommitted; README still advertises "9 parallel AI agents" (repo now has 8) — docs rot. `docs/` is empty. |
| I4 | 🟡 | No observability: `console.*` only; no Sentry/crash reporting; no analytics; no structured API logging. |
| I5 | 🟡 | Pricing page is 100% mock (every CTA → register; no Stripe/Paddle) while claiming SLAs, ERP procurement, Wokwi integration; feature cards show fabricated demo metrics presented as proof ("READY in 28.4s", "320mA/500mA"); currency flip-flops between "Rupees"/"Rs."/"LKR". |
| I6 | 🟡 | Missing product exports: BOM CSV, firmware file download, full-project JSON export/import. Clipboard copy lacks error handling + feedback semantics. |
| I7 | ⚪ | No email-verification or password-reset flow. Minimal SEO metadata (`keywords` as string — deprecated shape), no OG images/sitemap/robots. E2E hook IDs (`#create-project-submit-btn` etc.) shipped in markup. |

---

## Part 2 — Improvement Plan

Ordered by risk/leverage. Each phase is shippable independently. Estimates assume one developer.

### Phase 0 — Stabilize the tree (0.5 day)
1. Decide the fate of the removed PCB feature: commit the deletions + README/type updates, or restore the files. Update README (8 agents, current stack facts).
2. Resolve `package.json` / lockfile drift; pin exact versions where sensible.
3. Seed `docs/`: this audit, plus a short ARCHITECTURE.md (data flow diagram: form → create route → agents → panels; store strategy).
4. Enable branch protection + require PRs if repo is shared.

### Phase 1 — Security hardening (1.5–2 days) ← do first
1. **Fix Firestore rules** (S1):
   ```
   allow read: if request.auth != null && resource.data.uid == request.auth.uid;
   allow list: if request.auth != null && request.query... // keep uid-scoped
   ```
   Deploy and verify with the Rules Playground / emulator.
2. **Authenticate API routes** (S2): add `firebase-admin`; clients send ID token (`auth.currentUser.getIdToken()`); routes verify via `verifyIdToken` and derive uid server-side (stop trusting body-provided identity). Reject 401 otherwise.
3. **Validate everything with zod** (S4): shared schemas in `src/lib/schemas.ts` — `CreateProjectInput` (title ≤200, description ≤5000, board ∈ enum, `fileContents` array capped: count ≤ 5, item ≤ 20k chars), `AgentRequest`, `NaturalLanguageCommand`. Reject unknown fields (`strict()`).
4. **Real rate limiting** (S3): Upstash Redis (`@upstash/ratelimit`) or Vercel KV — sliding window per verified uid (e.g., 10 project creations/hour, 30 agent calls/min), applied uniformly to all three routes; return `X-RateLimit-*`.
5. **Close the redirect hole** (S5): allowlist `next` to relative paths starting with `/` (reject `//`); honor it in register too.
6. **Fix the route guard** (S6): exact-match `"/"` and `/auth/*` as public; everything else protected. Add `middleware.ts` for server-side defense-in-depth on `/project/*`.
7. Sanitize user/PDF text before prompt interpolation (wrap in explicit `<user_content>` fences, strip control chars) and cap total prompt tokens (S7). Remove dev-advice strings (S8).

### Phase 2 — LLM pipeline reliability (2–3 days)
1. **Structured output**: switch `generateJSON` to `responseMimeType: "application/json"` + zod-validated `responseSchema` per agent; on validation failure, retry once with the validator's error appended; hard 60s timeout; configurable model via env.
2. **Single orchestration module** (`src/lib/orchestrator.ts`): one registry mapping section name → agent fn + required context; consumed by create-route, agents-route, and NL editor's downstream regen (kills A3 duplication and B9 inconsistency).
3. **Per-section progress**: convert project creation to SSE (or chunked responses) emitting `section_started/section_done` events so UI shows live progress instead of one 30–60s spinner; add `AbortController` support client-side (A5).
4. Output sanity layer: clamp numbers ≥ 0 in power budget/BOM, dedupe component IDs, verify pin names against a small per-board GPIO table before rendering.
5. Implement or remove the four no-op NL operations (B6): `explain_design` / `suggest_improvements` should stream a text answer into the chat; `optimize_power` / `check_compatibility` should trigger their agents and post summaries. Stop dropping ops when clarifying questions exist — show questions AND stage the ops behind confirmation. Validate `change_board` against the union; fix `modify_pin`.

### Phase 3 — Data-layer correctness (2 days)
1. **Make Firestore the source of truth** (B1): `loadProject` always fetches cloud when signed in; localStorage demoted to offline cache compared via `updatedAt`. Delete keys after successful migration (fixes stale-shadowing + wasted reads). Return discriminated results (`{status: "ok"|"not_found"|"error", data?}`) so network errors stop masquerading as "not found" (B5).
2. **Kill the lost-update races** (B3): functional `setState(prev => …)` merges everywhere; disable retry/edit buttons while in-flight; per-section shallow merge instead of whole-object writes; fix the nested `errors` mutation.
3. **Persist undo/redo** through the same save path; scope Ctrl+Z to non-input focus; don't wipe history on conversation clear (B4).
4. Surface failures honestly (B5): replace bare catches with toast/banner states; truthful `cloudStatus` ("Saved on device — cloud unavailable"); delete = cloud-first then local.
5. Multi-tab safety: `storage` event listener to refresh open projects; optional `version` field with optimistic-concurrency check on save conflicts.

### Phase 4 — Frontend architecture & a11y (3–4 days)
1. **Decompose `page.tsx`** into: `LandingNav`, `HeroSection`, `FeaturesModal`, `NewProjectForm`, `ProjectsGrid` + `ProjectCard`, `UserMenu`, `Footer`. Make landing/marketing sections server components; keep interactive islands client-side.
2. Extract shared primitives: `DataPanel` shell (error/loading/empty/content + retry — removes ~200 dup lines), `AuthInput`, `GoogleButton`, CSS hover utilities replacing all JS style-mutation hovers, color tokens in Tailwind theme (`accent`, `danger`, `warn`…).
3. **A11y sweep**: dialog component with focus trap/Escape/restore + `aria-modal`; `aria-live="polite"` on chat + error regions; semantic buttons/tablist roles for board selector & nav tabs; `prefers-reduced-motion`; label all icon buttons; fix leaked Markdown copy.
4. **Error boundary** at app + project-page level with retry action; hydration-safe skeleton (deterministic widths).
5. Perf: `priority`+`sizes` on hero image, `useMemo` the features-filter, lazy-load pdfjs only on first file selection, code-split CircuitRenderer via `next/dynamic`, gate `reactStrictMode` back ON and fix Konva properly (generation-counter init effect + `ResizeObserver` + cursor-cleanup on unmount — fixes B2/B7 together).
6. Consistent agent invocation & file-input fixes (reset value post-selection, unify change/drop handlers, reset form state on success, honest empty-states in all panels).

### Phase 5 — Tests & CI (2 days)
1. Install **Vitest** + RTL + `msw`. Priority tests:
   - `gemini.ts` JSON cleaning/validation/retry logic (mock SDK)
   - orchestrator registry (all sections map, partial-failure aggregation)
   - `projectStore` (cache-vs-cloud precedence, error statuses, delete ordering)
   - NL operation applier (every op type incl. unknown/question-gated cases)
   - rate-limiter + zod schemas
2. **Playwright** e2e (mock Gemini endpoint): create-project happy path → project page renders all panels; sign-in gate redirects; NL edit applies a component add; retry-on-error path.
3. **GitHub Actions**: `lint + tsc --noEmit + vitest + next build` on PR; Playwright job nightly/optional; Dependabot for npm + actions.
4. Add Prettier + `eslint-plugin-tailwindcss`; drop shipped test-hook IDs in favor of `data-testid`.

### Phase 6 — Product polish (ongoing)
1. **Exports**: BOM → CSV, firmware → `.ino/.py` download, full project JSON export/import (also solves backup + share).
2. Fix Share: signed-in shareable read links backed by a proper `public` flag + rules, or export-based sharing.
3. **Billing decision**: wire Stripe checkout (Checkout Session + webhook → Firestore entitlements) or strip pricing claims to "coming soon"; remove fabricated demo metrics; unify currency to LKR.
4. **Observability**: Sentry (client + server), lightweight analytics on funnel events (created → opened → exported), structured logging helper for API routes.
5. Auth completeness: password-reset emails, email verification gating creation, register honors `?next=`.
6. SEO/meta: viewport export, per-page titles/descriptions, OG image for landing, `sitemap.ts` + `robots.ts`.

---

## Suggested order of execution (first two weeks)

```
Week 1: Phase 0 → Phase 1 (rules + authed APIs + zod + Redis limits)
        → start Phase 2 (structured output + orchestrator)
Week 2: finish Phase 2 → Phase 3 (store correctness) → Phase 5.3 CI early
        (so subsequent refactors are guarded) → Phase 4 in PR-sized chunks
```

**Top 5 if you only do five things:**
1. Fix `firestore.rules` public read (one line, huge exposure).
2. Put auth + rate limits on the AI endpoints (cost protection).
3. Make Firestore authoritative over localStorage (silent-data-loss class of bugs).
4. Add structured output + zod to the Gemini layer (correctness of the entire product depends on it).
5. Stand up CI + a first test suite before any refactor.
