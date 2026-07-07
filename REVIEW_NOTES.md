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

## Files reviewed
- [x] Architecture map (structure, schema, auth, middleware) — done for Phase 2.
- [ ] lib/auth.ts (detailed) — pending Phase 4
- [ ] lib/actions/authActions.ts (detailed) — pending Phase 4
- [ ] proxy.ts (detailed) — pending Phase 4
- [ ] lib/actions/{admin,buyer,farmer}Actions.ts — pending Phase 4
- [ ] lib/db.ts — pending Phase 4
