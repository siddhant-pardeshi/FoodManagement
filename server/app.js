import bcrypt from "bcryptjs";
import { getPool, ready, publicUser, today } from "./db.js";

/**
 * The REST API, hosted as a single serverless function on Vercel.
 * Endpoints and response codes mirror the original Spring Boot contract:
 *
 *   POST   /api/auth/register          201 · 400 · 409
 *   POST   /api/auth/login             200 · 401
 *   GET    /api/auth/users             200
 *   GET    /api/food                   200
 *   GET    /api/food/available         200
 *   GET    /api/food/donor/{id}        200
 *   POST   /api/food                   201 · 400
 *   PUT    /api/food/{id}              200 · 400 · 404
 *   DELETE /api/food/{id}              204 · 404
 *   GET    /api/requests               200
 *   POST   /api/requests               201 · 400 · 409
 *   GET    /api/requests/receiver/{id} 200
 *   GET    /api/requests/listing/{id}  200
 *   PUT    /api/requests/{id}/approve  200 · 404
 *   PUT    /api/requests/{id}/reject   200 · 404
 */

const SELF_REGISTRABLE_ROLES = ["DONOR", "RECEIVER"];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function send(res, status, body) {
  if (res.writableEnded) return;
  res.statusCode = status;
  if (body !== undefined) {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  } else {
    res.end();
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) req.destroy(); // 1 MB cap
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
}

function applyCors(req, res) {
  const allowed = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

// ---------------------------------------------------------------------------
// Validation (messages mirror the original bean-validation output)
// ---------------------------------------------------------------------------

function validateUserInput(u) {
  const errors = [];
  if (!u || !String(u.name || "").trim()) errors.push("Name is required");
  if (!u || !String(u.email || "").trim()) errors.push("Email is required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) errors.push("Email must be valid");
  if (!u || !u.password) errors.push("Password is required");
  else if (String(u.password).length < 6) errors.push("Password must be at least 6 characters");
  return errors;
}

function validateListingInput(l) {
  const errors = [];
  if (!l || !String(l.foodItem || "").trim()) errors.push("Food item is required");
  if (!l || l.quantity === undefined || l.quantity === null) errors.push("Quantity is required");
  else if (!Number.isInteger(Number(l.quantity)) || Number(l.quantity) < 1) {
    errors.push("Quantity must be at least 1");
  }
  if (!l || !l.expiryDate) errors.push("Expiry date is required");
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(l.expiryDate)) errors.push("Expiry date must be a valid date");
  if (!l || l.donorId === undefined || l.donorId === null) errors.push("Donor is required");
  return errors;
}

// ---------------------------------------------------------------------------
// Route handlers — all invoked as handler(req, res, body, params),
// where params holds the regex capture groups of the matched route.
// ---------------------------------------------------------------------------

async function register(req, res, body) {
  const errors = validateUserInput(body);
  if (errors.length) return send(res, 400, { message: errors.join("; ") });
  if (!SELF_REGISTRABLE_ROLES.includes(body.role)) {
    return send(res, 400, { message: "Role must be DONOR or RECEIVER" });
  }

  const db = getPool();
  const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [body.email]);
  if (existing.length) {
    return send(res, 409, { message: "An account with this email already exists" });
  }

  const hash = await bcrypt.hash(body.password, 10);
  const [result] = await db.query(
    "INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
    [body.name.trim(), body.email.trim(), hash, body.role, body.phone || null, body.address || null]
  );
  const [rows] = await db.query(
    "SELECT id, name, email, role, phone, address FROM users WHERE id = ?",
    [result.insertId]
  );
  return send(res, 201, publicUser(rows[0]));
}

async function login(req, res, body) {
  const db = getPool();
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
    (body && body.email) || "",
  ]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare((body && body.password) || "", user.password))) {
    return send(res, 401, { message: "Invalid email or password" });
  }
  return send(res, 200, publicUser(user));
}

async function listUsers(req, res) {
  const [rows] = await getPool().query(
    "SELECT id, name, email, role, phone, address FROM users ORDER BY id"
  );
  return send(res, 200, rows.map(publicUser));
}

const LISTING_SELECT = `
  SELECT id, food_item AS foodItem, quantity, category,
         expiry_date AS expiryDate, donor_id AS donorId, status,
         created_at AS createdAt
  FROM food_listings`;

async function listListings(req, res, body, params, where) {
  const sql = where
    ? `${LISTING_SELECT} WHERE ${where} ORDER BY id`
    : `${LISTING_SELECT} ORDER BY id`;
  const [rows] = await getPool().query(sql, params);
  return send(res, 200, rows);
}

async function createListing(req, res, body) {
  const errors = validateListingInput(body);
  if (errors.length) return send(res, 400, { message: errors.join("; ") });

  const db = getPool();
  const [result] = await db.query(
    `INSERT INTO food_listings (food_item, quantity, category, expiry_date, donor_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'AVAILABLE', ?)`,
    [body.foodItem.trim(), Number(body.quantity), body.category || "Other", body.expiryDate, body.donorId, today()]
  );
  const [rows] = await db.query(`${LISTING_SELECT} WHERE id = ?`, [result.insertId]);
  return send(res, 201, rows[0]);
}

async function updateListing(req, res, body, params) {
  const id = params[1];
  const errors = validateListingInput(body);
  if (errors.length) return send(res, 400, { message: errors.join("; ") });

  const db = getPool();
  const status = ["AVAILABLE", "REQUESTED", "DONATED"].includes(body.status) ? body.status : null;
  const [result] = await db.query(
    `UPDATE food_listings
     SET food_item = ?, quantity = ?, category = ?, expiry_date = ?, status = COALESCE(?, status)
     WHERE id = ?`,
    [body.foodItem.trim(), Number(body.quantity), body.category || "Other", body.expiryDate, status, id]
  );
  if (result.affectedRows === 0) return send(res, 404, { message: "Listing not found" });
  const [rows] = await db.query(`${LISTING_SELECT} WHERE id = ?`, [id]);
  return send(res, 200, rows[0]);
}

async function deleteListing(req, res, body, params) {
  const id = params[1];
  const [result] = await getPool().query("DELETE FROM food_listings WHERE id = ?", [id]);
  if (result.affectedRows === 0) return send(res, 404, { message: "Listing not found" });
  return send(res, 204);
}

const REQUEST_SELECT = `
  SELECT id, listing_id AS listingId, receiver_id AS receiverId,
         request_note AS requestNote, status, created_at AS createdAt
  FROM food_requests`;

async function listRequests(req, res, body, params, where) {
  const sql = where
    ? `${REQUEST_SELECT} WHERE ${where} ORDER BY id`
    : `${REQUEST_SELECT} ORDER BY id`;
  const [rows] = await getPool().query(sql, params);
  return send(res, 200, rows);
}

async function createRequest(req, res, body) {
  if (!body || body.listingId === undefined || body.listingId === null) {
    return send(res, 400, { message: "Listing is required" });
  }
  if (body.receiverId === undefined || body.receiverId === null) {
    return send(res, 400, { message: "Receiver is required" });
  }

  const db = getPool();
  const [listings] = await db.query("SELECT id, status FROM food_listings WHERE id = ?", [
    body.listingId,
  ]);
  if (!listings.length || listings[0].status !== "AVAILABLE") {
    return send(res, 409, { message: "This listing is no longer available" });
  }

  const [result] = await db.query(
    `INSERT INTO food_requests (listing_id, receiver_id, request_note, status, created_at)
     VALUES (?, ?, ?, 'PENDING', ?)`,
    [body.listingId, body.receiverId, body.requestNote || null, today()]
  );
  const [rows] = await db.query(`${REQUEST_SELECT} WHERE id = ?`, [result.insertId]);
  return send(res, 201, rows[0]);
}

async function decideRequest(req, res, body, params, requestStatus, listingStatus) {
  const id = params[1];
  const db = getPool();
  const [result] = await db.query("UPDATE food_requests SET status = ? WHERE id = ?", [
    requestStatus,
    id,
  ]);
  if (result.affectedRows === 0) return send(res, 404, { message: "Request not found" });

  const [rows] = await db.query(`${REQUEST_SELECT} WHERE id = ?`, [id]);
  const request = rows[0];
  await db.query("UPDATE food_listings SET status = ? WHERE id = ?", [
    listingStatus,
    request.listingId,
  ]);
  return send(res, 200, request);
}

// ---------------------------------------------------------------------------
// Routing table
// ---------------------------------------------------------------------------

const routes = [
  ["POST", /^\/auth\/register$/, register],
  ["POST", /^\/auth\/login$/, login],
  ["GET", /^\/auth\/users$/, listUsers],

  ["GET", /^\/food$/, listListings],
  ["GET", /^\/food\/available$/, (req, res) => listListings(req, res, {}, null, "status = 'AVAILABLE'")],
  ["GET", /^\/food\/donor\/(\d+)$/, (req, res, body, params) => listListings(req, res, body, [params[1]], "donor_id = ?")],
  ["POST", /^\/food$/, createListing],
  ["PUT", /^\/food\/(\d+)$/, updateListing],
  ["DELETE", /^\/food\/(\d+)$/, deleteListing],

  ["GET", /^\/requests$/, listRequests],
  ["POST", /^\/requests$/, createRequest],
  ["GET", /^\/requests\/receiver\/(\d+)$/, (req, res, body, params) => listRequests(req, res, body, [params[1]], "receiver_id = ?")],
  ["GET", /^\/requests\/listing\/(\d+)$/, (req, res, body, params) => listRequests(req, res, body, [params[1]], "listing_id = ?")],
  ["PUT", /^\/requests\/(\d+)\/approve$/, (req, res, body, params) => decideRequest(req, res, body, params, "APPROVED", "DONATED")],
  ["PUT", /^\/requests\/(\d+)\/reject$/, (req, res, body, params) => decideRequest(req, res, body, params, "REJECTED", "AVAILABLE")],
];

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function handle(req, res) {
  try {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }

    await ready();

    // On Vercel the API is one function (api/handler.js); a rewrite carries
    // the original /api/* path in the __path query parameter. Locally the
    // request URL holds the real path already.
    const url = new URL(req.url, "http://localhost");
    const forwarded = url.searchParams.get("__path");
    const routePath = forwarded ? `/${forwarded}` : url.pathname;
    const path = routePath.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
    const match = routes.find(([method, pattern]) => method === req.method && pattern.test(path));

    if (!match) return send(res, 404, { message: "Not found" });

    const [, pattern, handler] = match;
    const params = path.match(pattern);
    const body = ["POST", "PUT", "PATCH"].includes(req.method) ? await readBody(req) : {};
    if (body === null) return send(res, 400, { message: "Request body must be valid JSON" });

    await handler(req, res, body, params);
  } catch (err) {
    console.error("API error:", err);
    if (!res.writableEnded) send(res, 500, { message: "Internal server error" });
  }
}
