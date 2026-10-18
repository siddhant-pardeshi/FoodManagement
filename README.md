<p align="center"><img src="docs/assets/banner.svg" alt="Khaana Bachaao — Food Donation Platform" width="100%" /></p>

# Khaana Bachaao 🍽️

**A food wastage management platform that moves surplus food from donors to the people who need it — before it hits the landfill.**

[![Live on Vercel](https://img.shields.io/badge/live-khaana--bachaao.vercel.app-000?logo=vercel)](https://khaana-bachaao.vercel.app)
[![React](https://img.shields.io/badge/frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/api-Node.js%2022-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/database-MySQL%208-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why this exists

Roughly a third of all food produced is never eaten, while hundreds of millions of people go hungry. That gap is a *logistics* problem, not a scarcity problem. Khaana Bachaao closes it with a simple loop:

1. **Donors** — restaurants, event organisers, households — list surplus food with quantity and a freshness window.
2. **Receivers** — NGOs, shelters, families — browse what's available and request what they need.
3. Donors review requests, approve the best fit, and the listing is marked donated. Everything is visible to **admins** for accountability.

## Live demo

The whole platform runs on Vercel — frontend, API and cloud MySQL. Try it with the demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Donor | `ananya@demo.in` | `Demo@1234` |
| Receiver | `hope@demo.in` | `Demo@1234` |
| Admin | `admin@khaanabachaao.in` | `Khaana!Bachaao2026` |

## Screenshots

| Landing page | Donor dashboard |
| --- | --- |
| ![Landing page](docs/screenshots/home.png) | ![Donor dashboard](docs/screenshots/donor-dashboard.png) |

| Requesting food | Admin overview |
| --- | --- |
| ![Available food](docs/screenshots/available-food.png) | ![Admin dashboard](docs/screenshots/admin-dashboard.png) |

## Architecture

One Vercel project serves everything: the React SPA as static assets and the
REST API as a serverless function. The database is managed MySQL (Aiven
Serverless), so nothing needs to be awake on anyone's laptop.

```mermaid
flowchart LR
    B["Browser"] --> V["Vercel"]

    subgraph V ["Vercel — khaana-bachaao.vercel.app"]
        S["Static SPA<br/>React 19 + Vite"]
        F["Serverless function<br/>api/&#91;...path&#93;.js"]
    end

    DB[("Aiven MySQL 8<br/>khaana_bachaao")]

    B -- "GET / (static)" --> S
    S -- "fetch /api/*" --> F
    F -- "mysql2 · TLS" --> DB
```

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | React 19 · Vite · React Router 7 | SPA with role-based routing and scroll-reveal animations |
| API | Node.js 22 serverless function | Zero-framework router, single deployment, same-origin — no CORS |
| Auth | bcryptjs password hashing | Hashes never leave the server; sessions kept client-side |
| Database | MySQL 8 (Aiven) | Schema auto-created and admin account seeded on first boot |

## Project structure

```
FoodManagement/
├── api/
│   └── [...path].js        # Vercel serverless entry point
├── server/
│   ├── app.js              # Router + endpoint handlers
│   └── db.js               # MySQL pool, schema bootstrap, admin seeding
├── server.js               # Local dev server for the API (port 3005)
├── frontend/               # React 19 + Vite SPA
│   ├── src/
│   │   ├── components/     # Reveal (scroll animations)
│   │   ├── pages/          # Home, Login, Register, three dashboards
│   │   ├── api.js          # Typed fetch helpers for the API
│   │   └── Navbar.jsx
│   └── vite.config.js      # /api proxied to localhost:3005 in dev
├── docs/screenshots/
├── vercel.json             # Build + SPA rewrites
└── .env.example
```

## Getting started (local)

### Prerequisites

- **Node.js 18+**
- A MySQL 8 database — a local server or any cloud instance (Aiven has a free tier)

### 1. Configure the database connection

```bash
cp .env.example .env
# Edit DATABASE_URL, e.g.:
# DATABASE_URL=mysql://root:password@localhost:3306/food_wastage_db
```

### 2. Install and run

```bash
npm install                 # API dependencies
cd frontend && npm install  # Frontend dependencies
```

```bash
npm run dev:api             # API on http://localhost:3005
npm run dev:web             # SPA on http://localhost:5173 (proxies /api)
```

Tables are created automatically on first boot — no SQL to run by hand. A
default admin account is seeded too (see [Configuration](#configuration)).

> **Heads-up:** passwords are stored as BCrypt hashes. Accounts created by an
> older build of this project (which stored plaintext passwords) will no
> longer log in — simply re-register.

## User roles

| Role | Capabilities |
| --- | --- |
| **DONOR** | Post food listings, review incoming requests, approve/reject, delete listings |
| **RECEIVER** | Browse available food, raise requests with a note, track request status |
| **ADMIN** | Platform-wide view of users, listings and request activity with live stats |

The ADMIN role cannot be self-registered; it is seeded on first boot.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | — | `mysql://user:password@host:port/dbname` |
| `ADMIN_EMAIL` | `admin@khaanabachaao.in` | Seeded admin account |
| `ADMIN_PASSWORD` | `Admin@123` | Seeded admin password — change before deploying |
| `AIVEN_CA` | — | Optional CA certificate (PEM) to verify the DB TLS connection |
| `CORS_ORIGINS` | — | Optional; only needed if the SPA is hosted on a different origin |
| `VITE_API_BASE_URL` | `/api` | Frontend override for the API base URL |

## API reference

Base URL: `/api` — all responses are JSON except the bare `204`s.

### Auth

| Method | Endpoint | Body / Params | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password, role, phone?, address? }` | `201` — created user | `409` duplicate email, `400` invalid input / role |
| POST | `/auth/login` | `{ email, password }` | `200` — user profile | `401` bad credentials |
| GET | `/auth/users` | — | `200` — all users | |

### Food listings

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/food` | All listings |
| GET | `/food/available` | Listings open for request |
| GET | `/food/donor/{donorId}` | Listings by one donor |
| POST | `/food` | Create listing (validated) |
| PUT | `/food/{id}` | Update listing |
| DELETE | `/food/{id}` | Delete listing (`204`, `404` if missing) |

### Food requests

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/requests` | All requests |
| GET | `/requests/receiver/{id}` | Requests raised by a receiver |
| GET | `/requests/listing/{id}` | Requests against a listing |
| POST | `/requests` | Raise a request (`409` if listing no longer available) |
| PUT | `/requests/{id}/approve` | Approve — also marks the listing `DONATED` |
| PUT | `/requests/{id}/reject` | Reject — listing returns to `AVAILABLE` |

## Try the full flow

1. Register a **donor** and a **receiver** from the signup page.
2. Log in as the donor → post a listing (e.g. *Cooked Rice, qty 15*).
3. Log out, log in as the receiver → **Available Food** → *Request This Food*.
4. Log back in as the donor → *View Requests* → **Approve**.
5. The receiver now sees the request as `APPROVED`; the listing is `DONATED`.
6. Log in as the admin to see the platform-wide dashboard.

## Deployment

The project deploys as a single Vercel project: `vercel.json` builds the SPA
into `frontend/dist` and serves `api/*` as a serverless function. Pushes to
the connected Git branch deploy automatically.

1. Import the repo on [Vercel](https://vercel.com/new) (or run `vercel`).
2. Set the environment variables from the table above (`DATABASE_URL` etc.).
3. Deploy — no other configuration required.

For the database, [Aiven Serverless MySQL](https://aiven.io) has a free tier
that stays on around the clock; the API connects over TLS.

## Credits

- Landing imagery: [Unsplash](https://unsplash.com) (served locally from `frontend/public/`)
- Food-waste figures: UNEP Food Waste Index Report 2024 · FAO SOFI 2023

## License

Released under the [MIT License](LICENSE).
