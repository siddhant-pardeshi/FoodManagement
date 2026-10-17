# Khaana Bachaao — Frontend

React 19 + Vite single-page app for the food wastage management platform.

In development, `/api` requests are proxied to the local API server
(`npm run dev:api` from the repo root, port 3005). In production the same
`/api` routes are handled by the serverless function in the repo's `api/`
directory — same origin, no CORS involved.

## Scripts

| Command           | What it does                    |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start the dev server with HMR   |
| `npm run build`   | Production build into `dist/`   |
| `npm run preview` | Preview the production build    |
| `npm run lint`    | Lint with Oxlint                |

Set `VITE_API_BASE_URL` only if you need to target an API on a different
origin; by default the app calls `/api` on its own origin.
