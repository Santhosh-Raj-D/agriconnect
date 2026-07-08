# AgriConnect — Architecture Overview

> Generated during code review on 2026-07-08. Branch: `review/full-audit`.

## 1. What the project actually is

A **full-stack Next.js 16 application** (App Router, React 19, TypeScript) that connects
farmers, buyers, and admins in an agricultural marketplace. There is **no separate backend
service** — all server logic runs inside Next.js via **Server Actions**, backed by
**PostgreSQL through Prisma ORM**.

> ⚠️ The GitHub repo description ("Spring Boot backend and React frontend") is **incorrect**.
> There is no Spring Boot and no standalone React SPA. This is a single Next.js codebase.
> This is the first documentation-drift issue recorded in `REVIEW_NOTES.md`.

## 2. Technology stack

| Layer            | Technology                                             |
|------------------|--------------------------------------------------------|
| Framework        | Next.js 16.2.7 (App Router, Turbopack)                 |
| UI               | React 19.2.4, Tailwind CSS v4 (PostCSS)                |
| Language         | TypeScript 5                                           |
| Server logic     | Next.js Server Actions (`'use server'`)                |
| ORM / DB         | Prisma 6.19.3 → PostgreSQL                             |
| Auth             | Custom cookie-based sessions (no external auth library)|
| Routing guard    | Middleware (`proxy.ts`)                                |
| Lint             | ESLint 9 + eslint-config-next                          |
| Deploy           | Vercel (agriconnect-nu-five.vercel.app)                |

## 3. Directory structure

```
agriconnect/
├── app/                        # App Router: routes + layouts (server components by default)
│   ├── page.tsx                # Public landing page
│   ├── layout.tsx              # Root layout (fonts, globals, nav)
│   ├── globals.css             # Apple-inspired design system
│   ├── login/page.tsx          # Login form
│   ├── signup/page.tsx         # Registration form
│   ├── store/page.tsx          # Storefront (protected)
│   ├── admin/dashboard/page.tsx
│   ├── buyer/dashboard/page.tsx
│   └── farmer/dashboard/page.tsx
├── components/                 # Client + presentational components
│   ├── *DashboardClient.tsx    # Interactive dashboard UIs (admin/farmer)
│   ├── Storefront.tsx          # Product browsing + cart UI
│   └── Hero/Navbar/Footer/...  # Landing-page sections & shared UI
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── auth.ts                 # Session create/read/destroy + password hashing
│   └── actions/                # Server Actions = the "backend"
│       ├── authActions.ts      # login / signup / logout
│       ├── adminActions.ts     # admin operations (block users/products, etc.)
│       ├── buyerActions.ts     # place/cancel orders, order history
│       └── farmerActions.ts    # product CRUD, order fulfilment
├── prisma/
│   ├── schema.prisma           # Data model (Postgres)
│   └── seed.js                 # Seed script
├── proxy.ts                    # Middleware: route guarding
└── next.config.ts / tsconfig / eslint.config.mjs / postcss.config.mjs
```

## 4. Data model (Prisma)

Five models and three enums (`Role`, `OrderStatus`, `Category`):

- **User** — `id`, `email` (unique), `password` (hashed), `name`, `role` (FARMER/BUYER/ADMIN,
  default BUYER), farmer fields (`farmName`, `farmDetails`), `address`, `isBlocked`.
  Relations: `products` (as farmer), `orders` (as buyer), `sessions`.
- **Session** — `id`, `userId`, `expiresAt`; cascade-deleted with the user.
- **Product** — `name`, `price`, `unit`, `category`, `emoji`, `farmerId`, `isBlocked`.
- **Order** — `buyerId`, `totalPrice`, `status`, plus `items`.
- **OrderItem** — line item linking `order` ↔ `product`, with `quantity`,
  `priceAtPurchase`, and a denormalized `farmerId` for splitting orders across farmers.

## 5. Authentication & authorization

**Session model (custom, no library):**
- On login/signup, `createSession()` inserts a `Session` row and sets an **httpOnly** cookie
  `agri_session` (7-day expiry, `secure` in production, `sameSite=lax`).
- `getSessionUser()` looks up the session, checks expiry, checks `isBlocked`, and returns the
  user (or cleans up + returns null).
- Passwords are hashed in `hashPassword()` using **SHA-256 with a static salt**
  (`SESSION_SECRET` env var, falling back to a hardcoded default).

**Route guarding (`proxy.ts` middleware):**
- Protected prefixes: `/buyer/dashboard`, `/farmer/dashboard`, `/admin/dashboard`, `/store`.
- Redirects unauthenticated users (no cookie) to `/login?callbackUrl=…`.
- Redirects already-authenticated users away from `/login` and `/signup` to `/store`.
- ⚠️ The middleware only checks **cookie presence**, not session validity or **role** — so
  role-based access (e.g. a BUYER reaching `/admin/dashboard`) must be enforced inside the
  pages/actions. To be verified in the code-review phase.

## 6. Data flow (example: buyer places an order)

```
Browser (Storefront.tsx client component)
   │  form submit / action call
   ▼
Server Action (lib/actions/buyerActions.ts, 'use server')
   │  getSessionUser()  ── reads agri_session cookie ──► Session/User via Prisma
   │  validate + write Order + OrderItems
   ▼
Prisma Client (lib/db.ts singleton)
   ▼
PostgreSQL
   │  result
   ▼
Server Action returns { success, ... }
   ▼
Client updates UI / revalidates
```

Requests to protected routes first pass through `proxy.ts`, which gates on the session cookie
before the page/server-action runs.

## 7. Key files to review first (highest risk/complexity)

1. `lib/auth.ts` — password hashing & session lifecycle (security-critical).
2. `lib/actions/authActions.ts` — login/signup (input validation, role handling).
3. `proxy.ts` — route guard (auth/authorization completeness).
4. `lib/actions/adminActions.ts` — privileged operations.
5. `lib/actions/farmerActions.ts` (688-line client counterpart) — largest surface area.
6. `lib/actions/buyerActions.ts` — order/payment integrity.
7. `lib/db.ts` — Prisma singleton & logging config.

## 8. How to run

```bash
npm install                 # installs deps + runs prisma generate (postinstall)
# create .env with DATABASE_URL (PostgreSQL) and SESSION_SECRET
npm run build               # prisma generate && next build
npm run dev                 # dev server on http://localhost:3000
npm run lint                # eslint
```

A live PostgreSQL database (via `DATABASE_URL`) is required to actually run the dashboards;
the static build compiles without one.
