import http from "node:http";
import { handle } from "./server/app.js";

// Local development server for the API. The production deployment runs the
// same handler as a Vercel serverless function (see api/[...path].js).
// Usage: npm run dev:api   (loads .env from the repo root)

const port = process.env.PORT || 3005;

http
  .createServer((req, res) => handle(req, res))
  .listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
