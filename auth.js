// auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ADMIN_PASSWORD) {
  throw new Error("❌ ADMIN_PASSWORD missing in .env");
}
if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET missing in .env");
}

/**
 * POST /api/auth/login
 * Body: { password: string }
 * Returns: { ok: true, token: <jwt> } on success
 */
export function login(req, res) {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });

  // Exact match against server-side secret (safe because in .env)
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid password" });

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "2h" });
  return res.json({ ok: true, token });
}

/**
 * Express middleware to protect admin routes
 * Expects header: Authorization: Bearer <token>
 */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing Authorization header" });

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ error: "Invalid authorization format" });

  const token = parts[1];
  try {
    jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}
