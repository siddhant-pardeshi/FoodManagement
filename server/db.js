import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

/**
 * MySQL connection used by the serverless API.
 *
 * DATABASE_URL format: mysql://user:password@host:port/dbname
 * Connections are TLS-encrypted; provide AIVEN_CA (PEM) to also verify the
 * server certificate, otherwise the certificate is accepted without
 * verification (fine for a demo, not for production data).
 */

let pool = null;

function configFromUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

export function getPool() {
  if (pool) return pool;

  const base = process.env.DATABASE_URL
    ? configFromUrl(process.env.DATABASE_URL)
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "food_wastage_db",
      };

  const ca = process.env.AIVEN_CA;
  pool = mysql.createPool({
    ...base,
    waitForConnections: true,
    connectionLimit: 5,
    dateStrings: true, // DATE columns come back as "YYYY-MM-DD" strings
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
  });
  return pool;
}

/** Creates the schema and the default admin account on first use. */
let readyPromise = null;
export function ready() {
  if (!readyPromise) readyPromise = initialize();
  return readyPromise;
}

async function initialize() {
  const db = getPool();
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(30),
    address VARCHAR(255)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS food_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    food_item VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    category VARCHAR(50),
    expiry_date DATE NOT NULL,
    donor_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at DATE NOT NULL
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS food_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    receiver_id INT NOT NULL,
    request_note VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATE NOT NULL
  )`);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@khaanabachaao.in";
  const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [adminEmail]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@123", 10);
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'ADMIN')",
      ["Platform Admin", adminEmail, hash]
    );
    console.log("Seeded default admin account:", adminEmail);
  }
}

export function publicUser(row) {
  if (!row) return null;
  const { id, name, email, role, phone, address } = row;
  return { id, name, email, role, phone, address };
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
