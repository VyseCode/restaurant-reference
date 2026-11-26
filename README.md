# Saffron & Spice — Restaurant Website Reference

A single-restaurant website: browse a menu, reserve a table, order online, review completed orders, and manage the restaurant from an admin dashboard.

Reference implementation inspired by restaurant ordering platforms (Zomato/Swiggy-style flows), with architecture modeled on the `inFlow` (LinkedIn) reference app: Next.js 16 App Router, React 19, Tailwind 4, TypeScript, MongoDB/Mongoose, bcryptjs, `jose` JWT cookies, and zod.

## Features

- Email/password auth with bcrypt hashing, signed JWTs in HTTP-only cookies, and `customer` / `admin` roles
- Menu categories and items with price, image, dietary tags, availability and popularity counters
- Daily specials with a unique per-date/per-item rule
- Table reservations with time slots, atomic per-slot capacity claims, no double-booking, past-slot guards, cancellations, admin management and configurable capacity
- Cart with quantity controls, unavailable-item guard, and checkout into `dine-in`, `takeaway` or `delivery` orders
- Order workflow `placed → preparing → ready → completed`, payment status, cancellation, and admin-only transitions
- Reviews allowed only for completed orders, one per order; favorites for customers
- Admin dashboard: revenue, order statuses, booking counts and popular items
- Responsive menu grid, filters, search, sorting, pagination, cart, reservation form, and loading/empty/error states

## Local setup

1. `npm install`
2. Start MongoDB on `127.0.0.1:27017` (or set `MONGODB_URI`)
3. Copy `.env.example` to `.env.local` and set a real `JWT_SECRET`
4. `npm run seed` (wipes only the `restaurant_ref` database and recreates it)
5. `npm run dev` and open http://localhost:3000 (production port: 3207)

## Demo accounts

All accounts use password `password123`.

| Account | Role | What to try |
| --- | --- | --- |
| `alex@example.com` | customer | Seeded cart, completed order (reviewable), favorites, booking at tomorrow 18:00 |
| `priya@example.com` | customer | Placed order (not yet reviewable), booking in the full 19:00 slot |
| `marcus@example.com` | customer | Preparing order, past completed booking |
| `sofia@example.com` | customer | Ready order and a cancelled booking |
| `admin@restaurant.test` | admin | `/admin` dashboard and all management pages |

Seed data covers every order status, reservation status, unavailable items, specials for today and tomorrow, two favorites per active customer where applicable, and reviews for completed orders.

## Checks

```bash
npm run lint        # eslint, 0 errors/warnings
npm run typecheck   # tsc --noEmit
npm run build
npm run seed        # re-runnable; run twice safely
npm run start -- -p 3207
```

## API

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Create account (201; 409 on duplicate) | public |
| POST | `/api/auth/login` | Sign in | public |
| POST | `/api/auth/logout` | Clear session cookie | signed in |
| GET | `/api/auth/me` | Current user (401 when anonymous) | signed in |
| GET / POST | `/api/categories` | List / create category | create: admin |
| PATCH / DELETE | `/api/categories/[id]` | Update / delete category | admin |
| GET / POST | `/api/menu` | Search/filter/sort/paginate / create item | create: admin |
| GET / PATCH / DELETE | `/api/menu/[id]` | Item detail / update / delete | mutations: admin |
| GET / POST | `/api/specials` | Daily specials / create | create: admin |
| PATCH / DELETE | `/api/specials/[id]` | Update / delete special | admin |
| GET / POST | `/api/reservations` | My bookings / book a slot | signed in |
| GET / PATCH / DELETE | `/api/reservations/[id]` | Detail / status change (customer cancel only) / delete | owner or admin |
| GET / POST / PATCH / DELETE | `/api/cart` | View / add / change qty / clear | signed in |
| DELETE | `/api/cart/[itemId]` | Remove a line | signed in |
| GET / POST | `/api/orders` | My orders / checkout cart | signed in |
| GET / PATCH | `/api/orders/[id]` | Order detail / status + payment | owner / admin (PATCH admin only) |
| GET / POST | `/api/reviews` | Reviews / review a completed order | POST signed in |
| DELETE | `/api/reviews/[id]` | Remove own review | owner or admin |
| GET / POST | `/api/favorites` | Favorite items / toggle | signed in |
| GET | `/api/admin/stats` | Orders, revenue, bookings, popular items | admin |
| GET / PATCH | `/api/admin/reservations/capacity` | Per-slot capacity and booked counts / set capacity | admin |

## Pages

`/`, `/login`, `/register`, guarded `(app)` pages: `/menu`, `/menu/[id]`, `/cart`, `/reservations`, `/orders`, `/orders/[id]`, `/account`, and admin-only `/admin`, `/admin/orders`, `/admin/reservations`, `/admin/menu`, `/admin/specials`.

## Scalability & security notes

- Cached Mongoose connection with bounded pool; `.lean()` projections on list queries
- Cursor-free but capped page/limit pagination (`limit ≤ 48`) with indexes on sort/filter keys
- Unique compound indexes enforce one confirmed booking per user/date/slot, one favorite per user/item, one special per date/item, one review per order
- Slot capacity is a per-slot document claimed with a conditional `$inc`, so concurrent requests for the last seat yield exactly one confirmation; cancels, deletes and status changes release seats, and a failed create compensates by releasing its claim
- Denormalized popularity counters use atomic `$inc`; schema `min` guards against negative values
- Every mutation is zod-validated and authz-checked server-side; passwords use `select: false` and are never serialized
- Customer/admin separation is enforced in route handlers and the admin layout, not just in the UI

## Known limitations

- Seat claims and reservation writes are two operations with compensating rollback rather than one multi-document transaction; a replica set could wrap them in a transaction. Existing databases should be re-seeded to backfill capacity documents.
- No real payment gateway: `paymentStatus` is set by staff from the admin panel.
- Images are CSS placeholders; the seeded menu uses empty `imageUrl` values (the field is supported in the API).
- No email verification, password reset, rate limiting, or CSRF tokens (same-site lax cookies are used).
- Server local time defines "today" for reservation validation; restaurant timezone configuration is not implemented.
