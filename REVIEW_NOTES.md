# Review Notes — AgriConnect

Branch: `review/full-audit` · Started: 2026-07-08

## Overall code quality (initial impression)
- Clean, conventional Next.js App Router layout; sensible separation of `app/` (routes),
  `components/` (UI), `lib/actions/` (server logic), `lib/` (infra).
- Consistent commit style (Conventional Commits). Solo project, 8 commits, **no tests**.
- Server Actions used correctly with `'use server'`. Prisma singleton pattern is correct.

## Architecture observations
- Single Next.js codebase; **no Spring Boot / separate React app** despite the repo
  description. (See Technical debt → documentation drift.)
- Auth is a hand-rolled cookie-session system rather than a vetted library. Works, but the
  password hashing is weak (see BUG_REPORT SEC-001).
- Middleware (`proxy.ts`) guards on cookie *presence* only — no session-validity or **role**
  check. Authorization therefore depends entirely on per-page/per-action checks, which must
  be verified everywhere (risk of missed checks).

## Recommendations (running list)
- Replace SHA-256+static-salt hashing with `bcrypt`/`argon2`/`scrypt` + per-user salt.
- Validate and constrain `role` on signup (never trust client-supplied role → ADMIN).
- Add role checks in every privileged page/server action; consider centralizing.
- Add `.env.example` documenting `DATABASE_URL` and `SESSION_SECRET`.
- Fix repo description / README stack mismatch.
- Add basic tests (auth, order totals) — none exist.

## Technical debt
- **Documentation drift:** repo description & README claim Spring Boot + React; actual stack
  is Next.js + Prisma. README is the unmodified `create-next-app` boilerplate.
- **Stray lockfile:** `C:\Users\avgc9\package-lock.json` outside the project confuses Next.js
  workspace-root detection (build warning). Not part of the repo; clean up locally.
- **2 moderate npm vulnerabilities** reported by `npm audit` (not yet triaged; do NOT run
  `audit fix --force` — it applies breaking changes).
- Prisma client configured with `log: ['query']` — verbose; reconsider for production.

## Future improvements
- CI (lint + build + tests) via GitHub Actions.
- Rate limiting on login/signup.
- Input validation layer (e.g. Zod) shared across server actions.

## Lint status (Phase 8)
`npm run lint` reports **19 problems (12 errors, 7 warnings)** — all **pre-existing**; the
review's fixes introduced none. Grouped:
- `@typescript-eslint/no-explicit-any` (errors): `state: any` params in server actions
  (`authActions.ts`, `farmerActions.ts`) and `as any` casts in `buyer/dashboard/page.tsx`.
  Idiomatic-but-loose; fix by typing the action state (e.g. a shared `ActionState` type).
- `no-unused-vars` (warnings): `toggleProductBlockStatus` import, `showProfileModal`,
  `destroySession` catch `error`, several seed variables.
- `no-require-imports` (errors): `prisma/seed.js` uses CommonJS `require()`.
Recommend a separate `chore(lint)` PR — kept out of this security-focused PR to preserve a
clean, reviewable diff.

## Files reviewed
- [x] Architecture map (structure, schema, auth, middleware) — Phase 2.
- [x] lib/auth.ts — reviewed + fixed (SEC-001).
- [x] lib/actions/authActions.ts — reviewed + fixed (SEC-002, INFO-001).
- [x] proxy.ts — reviewed (SEC-003 informational; per-page checks confirmed).
- [x] lib/actions/adminActions.ts — reviewed; authorization correct.
- [x] lib/actions/buyerActions.ts — reviewed + fixed (BUG-004).
- [x] lib/actions/farmerActions.ts — reviewed + fixed (BUG-005).
- [x] app/{admin,buyer,farmer}/dashboard/page.tsx — reviewed; role checks present.
- [x] lib/db.ts — reviewed; Prisma singleton correct (note: `log: ['query']` verbose).
