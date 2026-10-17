import { handle } from "../server/app.js";

// Single Vercel serverless function serving the whole /api/* surface.
// vercel.json rewrites /api/<path> here with the original path in the
// __path query parameter.
export default async function handler(req, res) {
  await handle(req, res);
}
