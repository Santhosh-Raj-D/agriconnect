# Bug Report — AgriConnect

Branch: `review/full-audit` · Started: 2026-07-08

Severity scale: **Critical** (exploitable / data loss) · **High** · **Medium** · **Low** · **Info**
Status values: `Open` · `Confirmed` · `In Progress` · `Fixed` · `Won't Fix`

> Findings below are **preliminary** — captured during Phases 1–2. Each will be confirmed by
> reading the exact code in Phase 4 before any fix is written.

---

## SEC-001 — Weak password hashing (SHA-256 + static salt)
- **File:** `lib/auth.ts` (`hashPassword`)
- **Severity:** High
- **Description:** Passwords are hashed with a single SHA-256 pass and a **static** salt that
  falls back to a hardcoded value (`agriconnect-default-salt-value-2026`).
- **Steps to reproduce:** Inspect `hashPassword`; same password → same hash for all users.
- **Expected:** Slow, per-user-salted hashing (bcrypt/argon2/scrypt).
- **Actual:** Fast unsalted-per-user hash; vulnerable to rainbow tables & GPU brute force.
- **Root cause:** Hand-rolled hashing without a password-hashing KDF.
- **Solution:** Rewrote `hashPassword` to use Node's built-in **scrypt** with a unique random
  16-byte salt per user, stored as `scrypt$<salt>$<hash>` (no new dependency). Added
  `verifyPassword` with **timing-safe** comparison that also verifies legacy SHA-256 hashes and
  reports `needsUpgrade`; `login` transparently re-hashes legacy users to scrypt on next
  successful login. Existing accounts keep working and are migrated automatically.
- **Status:** **Fixed** (build verified) · **Commit:** `974b09e`

## SEC-002 — Privilege escalation via signup `role`
- **File:** `lib/actions/authActions.ts` (`signup`)
- **Severity:** Critical
- **Description:** `role` is read directly from `formData` and passed to `db.user.create`.
  The TypeScript cast `as 'BUYER' | 'FARMER'` is compile-time only; at runtime a crafted
  request could submit `role=ADMIN` (a valid Prisma enum value), creating an admin account.
- **Steps to reproduce:** POST the signup server action with `role=ADMIN` → admin account created.
- **Expected:** Only BUYER/FARMER self-registration; ADMIN never self-assignable.
- **Actual:** Arbitrary valid enum role accepted (CONFIRMED by reading the code).
- **Root cause:** Trusting client-supplied role without a server-side whitelist.
- **Solution:** Added a server-side guard rejecting any role other than BUYER/FARMER
  before user creation.
- **Status:** **Fixed** (build verified) · **Commit:** `f1548f3` (reinforced in `974b09e`)

## SEC-003 — Middleware guards on cookie presence only (no validity / role)
- **File:** `proxy.ts`
- **Severity:** Info (downgraded from Medium)
- **Update after review:** Every protected page calls `getSessionUser()` and redirects on
  wrong role, and every privileged server action re-checks role + ownership. The middleware
  is therefore a UX convenience, not the security boundary — real enforcement exists
  downstream. Left as Info; recommend documenting the trust boundary.
- **Description:** `proxy()` allows any request that merely *has* an `agri_session` cookie,
  regardless of whether the session is valid/expired, and does **not** enforce role. Access
  control depends entirely on per-page checks.
- **Expected:** Defense-in-depth — reject invalid sessions and wrong-role access at the edge,
  or ensure every protected page/action re-checks.
- **Actual:** Forged/expired cookie passes the middleware; role not considered.
- **Root cause:** Middleware cannot easily hit the DB (edge); relies on downstream checks.
- **Solution (proposed):** Verify per-page `getSessionUser()` + role on every protected route;
  document the trust boundary.
- **Status:** Open (needs per-page verification in Phase 4) · **Commit:** _TBD_

## BUG-004 — `placeOrder` accepts non-positive / unvalidated quantity
- **File:** `lib/actions/buyerActions.ts` (`placeOrder`)
- **Severity:** Medium
- **Description:** `cartItem.quantity` is used directly in `priceAtPurchase * cartItem.quantity`
  with no check that it is a positive number. A negative quantity yields a **negative order
  total** (and corrupts admin revenue/volume metrics, which sum `quantity * priceAtPurchase`).
  Duplicate `productId`s in the cart also break the `products.length !== cartItems.length`
  availability check (unique products vs. line items).
- **Steps to reproduce:** Call `placeOrder([{ productId, quantity: -5 }])`.
- **Expected:** Reject quantities that are not finite numbers > 0.
- **Actual:** Order created with negative/zero total.
- **Root cause:** Missing server-side validation of client-supplied quantities.
- **Solution:** Added a validation loop rejecting any item whose `productId` is not a non-empty
  string or whose `quantity` is not a finite number > 0, and aggregated duplicate productIds
  into a `Map` so the availability check and totals are computed from unique products.
- **Status:** **Fixed** (build verified) · **Commit:** `a54df26`

## BUG-005 — Farmer can change status of an entire multi-farmer order
- **File:** `lib/actions/farmerActions.ts` (`updateOrderStatus`)
- **Severity:** Medium
- **Description:** A farmer holding *any* item in an order may set the status of the **whole**
  order (`db.order.update`), affecting other farmers' items and the buyer's view. Also allows a
  farmer to set arbitrary statuses including CANCELLED.
- **Expected:** A farmer should only affect the fulfilment state of their own items, or status
  transitions should be constrained/validated.
- **Actual:** Whole-order status overwritten by any participating farmer.
- **Root cause:** Order status is a single field on `Order`; no per-farmer sub-status model.
- **Solution:** Whitelisted the statuses a farmer may set to `{SHIPPED, DELIVERED}` — farmers
  can no longer set `PENDING` or `CANCELLED`, removing the destructive/undo transitions. The
  underlying single-status-per-order limitation for multi-farmer orders is documented in-code
  and remains as future work (needs per-item fulfilment state).
- **Status:** **Mitigated** (destructive transitions blocked; architectural fix deferred) · **Commit:** `a54df26`

## INFO-001 — No input validation on signup/login
- **File:** `lib/actions/authActions.ts`
- **Severity:** Low/Medium
- **Description:** No email-format or password-strength validation; no rate limiting.
- **Solution:** Added email-format validation (regex) and a minimum password length (8) on
  signup, and normalized email to lowercase/trimmed on both signup and login (prevents
  duplicate accounts and case-sensitive login failures). **Rate limiting is still not
  implemented** and remains recommended future work.
- **Status:** **Partially fixed** (validation added; rate limiting deferred) · **Commit:** `974b09e`
