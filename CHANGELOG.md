# Changelog — AgriConnect Review

All notable changes made during the `review/full-audit` branch are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/). Dates are ISO 8601.

## [Unreleased] — review/full-audit

### 2026-07-08
- **Added:** `Architecture.md` — full architecture summary (stack, structure, data model,
  auth, data flow, review priorities).
- **Added:** `REVIEW_NOTES.md`, `BUG_REPORT.md`, `CHANGELOG.md` review-tracking documents.
- **Review:** Completed Phase 1 (setup: clone, branch, install, build) and Phase 2
  (project understanding). Build succeeds with a placeholder `DATABASE_URL`.

### 2026-07-08 — Fixes (pending build-verify + commit)
- **Security (SEC-002, Critical):** `lib/actions/authActions.ts` — server-side whitelist in
  `signup` rejecting any `role` other than `BUYER`/`FARMER`, preventing privilege escalation
  to `ADMIN`.
- **Security (SEC-001, High):** `lib/auth.ts` — replaced SHA-256+static-salt hashing with
  built-in **scrypt** + per-user random salt; added timing-safe `verifyPassword` with
  legacy-hash support; `login` transparently upgrades legacy hashes on success.
- **Bug (BUG-004, Medium):** `lib/actions/buyerActions.ts` — validate cart quantities
  (finite, > 0) and aggregate duplicate productIds; totals computed from server-side prices.
- **Bug (BUG-005, Medium → mitigated):** `lib/actions/farmerActions.ts` — restrict farmer
  order-status changes to `SHIPPED`/`DELIVERED`, blocking destructive PENDING/CANCELLED sets.
- **Hardening (INFO-001):** `lib/actions/authActions.ts` — email-format + min-password-length
  validation and email normalization on signup/login.

### Files modified
- `lib/auth.ts`
- `lib/actions/authActions.ts`
- `lib/actions/buyerActions.ts`
- `lib/actions/farmerActions.ts`

### Deferred / future work
- SEC-003 (Info): document middleware trust boundary (per-page/action checks confirmed present).
- BUG-005 full fix: per-item fulfilment status for multi-farmer orders.
- INFO-001: add rate limiting on login/signup.
