// ====== BNDLABS BACKEND SERVER ======
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB, getCollection } from "./db-client.js";
import { login, authMiddleware } from "./auth.js"; // <- new
dotenv.config();

const app = express();

// ====== JSON BODY PARSER ======
app.use(express.json({ limit: "1mb" }));

// ====== CORS ======
const FRONTEND = process.env.FRONTEND_ORIGIN || "https://bndlabs-frontend.onrender.com";
app.use(cors({
  origin: [FRONTEND, "http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.options("*", cors());

// ====== Absolute path fix ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

// Ensure data directory exists (kept for fallback/migration)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("📁 Created missing data folder:", dataDir);
}

// ====== Helpers - JSON fallback (first-run migration) ======
const readJSON = (file, fallback) => {
  try {
    const filepath = path.join(dataDir, file);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(fallback, null, 2));
      console.log(`🆕 Created missing file: ${file}`);
    }
    return JSON.parse(fs.readFileSync(filepath, "utf8"));
  } catch (err) {
    console.error("❌ Error reading", file, err);
    return fallback;
  }
};

const writeJSON = (file, data) => {
  try {
    fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data ?? {}, null, 2));
    console.log(`✅ Updated ${file}`);
  } catch (err) {
    console.error("❌ Failed to write", file, err);
  }
};

// ====== GENERIC READ (Mongo) ======
async function readFromDB(collectionName) {
  const col = getCollection(collectionName);
  const docs = await col.findOne({ _id: "singleton" });

  if (!docs) {
    const fb = readJSON(collectionName + ".json", collectionName.endsWith("s") ? [] : {});
    // Store fallback in Mongo for future use
    await col.insertOne({ _id: "singleton", data: fb });
    return fb;
  }

  return docs.data ?? (collectionName.endsWith("s") ? [] : {});
}

// ====== GENERIC SAVE (Mongo) ======
async function saveToDB(collectionName, payload) {
  const col = getCollection(collectionName);
  await col.updateOne(
    { _id: "singleton" },
    { $set: { data: payload } },
    { upsert: true }
  );
  return true;
}

// ====== AUTH ROUTE ======
app.post("/api/auth/login", login);

// ====== READ (public) ROUTES ======
app.get("/api/home", async (req, res) => res.json(await readFromDB("home")));
app.get("/api/projects", async (req, res) => res.json(await readFromDB("projects")));
app.get("/api/blogs", async (req, res) => res.json(await readFromDB("blogs")));
app.get("/api/profile", async (req, res) => res.json(await readFromDB("profile")));
app.get("/api/about", async (req, res) => res.json(await readFromDB("about")));
app.get("/api/contact", async (req, res) => res.json(await readFromDB("contact")));
app.get("/api/404", async (req, res) => res.json(await readFromDB("404")));
app.get("/api/socials", async (req, res) => res.json(await readFromDB("socials")));

// ====== WRITE (protected) ROUTES FOR CMS (Admin) ======
app.post("/api/home", authMiddleware, async (req, res) => { await saveToDB("home", req.body); res.json({ ok: true }); });
app.post("/api/projects", authMiddleware, async (req, res) => { await saveToDB("projects", req.body); res.json({ ok: true }); });
app.post("/api/blogs", authMiddleware, async (req, res) => { await saveToDB("blogs", req.body); res.json({ ok: true }); });
app.post("/api/profile", authMiddleware, async (req, res) => { await saveToDB("profile", req.body); res.json({ ok: true }); });
app.post("/api/about", authMiddleware, async (req, res) => { await saveToDB("about", req.body); res.json({ ok: true }); });
app.post("/api/contact", authMiddleware, async (req, res) => { await saveToDB("contact", req.body); res.json({ ok: true }); });
app.post("/api/404", authMiddleware, async (req, res) => { await saveToDB("404", req.body); res.json({ ok: true }); });
app.post("/api/socials", authMiddleware, async (req, res) => { await saveToDB("socials", req.body); res.json({ ok: true }); });

// ====== MESSAGES (visitor submit remains public) ======

// Public: submit message (visitor contact form) — remains public
app.post("/api/messages", async (req, res) => {
  const payload = {
    id: Date.now().toString(),
    name: req.body.name ?? "",
    email: req.body.email ?? "",
    message: req.body.message ?? "",
    date: new Date().toISOString(),
    read: false
  };

  const col = getCollection("messages");
  await col.insertOne(payload);

  res.json({ ok: true, item: payload });
});

// ===== Admin: message listing & admin actions (PROTECTED) ======

// Protected: list all messages (admin only)
app.get("/api/messages", authMiddleware, async (req, res) => {
  const col = getCollection("messages");
  const messages = await col.find({}).sort({ date: -1 }).toArray();
  res.json(messages);
});

// Protected: paginated (admin only)
app.get("/api/messages/paginated", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const col = getCollection("messages");
  const total = await col.countDocuments({});

  const messages = await col
    .find({})
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  res.json({ page, limit, total, messages });
});

// Protected: mark-read (admin only)
app.post("/api/messages/mark-read", authMiddleware, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing message ID" });

  const col = getCollection("messages");
  const result = await col.updateOne({ id }, { $set: { read: true } });

  if (result.matchedCount === 0) return res.status(404).json({ error: "Message not found" });

  res.json({ ok: true });
});

// Protected: delete (admin only)
app.post("/api/messages/delete", authMiddleware, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing message ID" });

  const col = getCollection("messages");
  await col.deleteOne({ id });

  res.json({ ok: true });
});

// ====== SEND MESSAGE (Brevo) - public (visitor contact) ======
app.post("/api/send-message", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: "Missing required fields" });

  const BREVO_KEY = process.env.BREVO_API_KEY;
  const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@bndlabs.com";
  const ADMIN_EMAIL = process.env.EMAIL_USER;

  if (!BREVO_KEY || !ADMIN_EMAIL) {
    console.error("❌ Missing BREVO_API_KEY or EMAIL_USER in environment");
    return res.status(500).json({ error: "Email service not configured" });
  }

  try {
    let adminTemplate = `<div>New message from {{name}} &lt;{{email}}&gt;<br/>{{message}}</div>`;
    let visitorTemplate = `<div>Hi {{name}},<br/>We received your message: <br/>{{message}}</div>`;
    const adminPath = path.join(__dirname, "email-templates", "admin-email.html");
    const visitorPath = path.join(__dirname, "email-templates", "visitor-email.html");

    if (fs.existsSync(adminPath)) adminTemplate = fs.readFileSync(adminPath, "utf8");
    if (fs.existsSync(visitorPath)) visitorTemplate = fs.readFileSync(visitorPath, "utf8");

    const adminHTML = adminTemplate.replace(/{{name}}/g, name).replace(/{{email}}/g, email).replace(/{{message}}/g, message);
    const visitorHTML = visitorTemplate.replace(/{{name}}/g, name).replace(/{{email}}/g, email).replace(/{{message}}/g, message);

    const send = async (payload) => {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`Brevo status ${resp.status} - ${text}`);
      }
      return resp.json();
    };

    // Send admin
    await send({
      sender: { name: "bndlabs", email: FROM_EMAIL },
      to: [{ email: ADMIN_EMAIL }],
      subject: `New message from ${name}`,
      htmlContent: adminHTML
    });

    // Send visitor
    await send({
      sender: { name: "bndlabs", email: FROM_EMAIL },
      to: [{ email }],
      subject: `Thanks — we got your message`,
      htmlContent: visitorHTML
    });

    // Save message in Mongo
    const col = getCollection("messages");
    const saved = {
      id: Date.now().toString(),
      name,
      email,
      message,
      date: new Date().toISOString(),
      read: false
    };
    await col.insertOne(saved);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Brevo API Error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 BndLabs backend running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ Failed to connect to DB:", err);
  process.exit(1);
});
