// ====== BNDLABS BACKEND SERVER ======
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB, getCollection } from "./db-client.js";
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

// ====== Paths ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== JSON FALLBACKS FOR FIRST MIGRATION ======
function fallback(name) {
  const p = path.join(__dirname, "data", name + ".json");
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  return name.endsWith("s") ? [] : {};
}

// ====== GENERIC READ (Mongo) ======
async function readFromDB(collectionName) {
  const col = getCollection(collectionName);
  const docs = await col.findOne({ _id: "singleton" });

  if (!docs) {
    const fb = fallback(collectionName);
    await col.insertOne({ _id: "singleton", data: fb });
    return fb;
  }

  return docs.data ?? {};
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

// ====== PAGE ROUTES ======
app.get("/api/home", async (req, res) => res.json(await readFromDB("home")));
app.get("/api/projects", async (req, res) => res.json(await readFromDB("projects")));
app.get("/api/blogs", async (req, res) => res.json(await readFromDB("blogs")));
app.get("/api/profile", async (req, res) => res.json(await readFromDB("profile")));
app.get("/api/about", async (req, res) => res.json(await readFromDB("about")));
app.get("/api/contact", async (req, res) => res.json(await readFromDB("contact")));
app.get("/api/404", async (req, res) => res.json(await readFromDB("404")));
app.get("/api/socials", async (req, res) => res.json(await readFromDB("socials")));

// ====== PAGE WRITE ROUTES ======
app.post("/api/home", async (req, res) => { await saveToDB("home", req.body); res.json({ ok: true }); });
app.post("/api/projects", async (req, res) => { await saveToDB("projects", req.body); res.json({ ok: true }); });
app.post("/api/blogs", async (req, res) => { await saveToDB("blogs", req.body); res.json({ ok: true }); });
app.post("/api/profile", async (req, res) => { await saveToDB("profile", req.body); res.json({ ok: true }); });
app.post("/api/about", async (req, res) => { await saveToDB("about", req.body); res.json({ ok: true }); });
app.post("/api/contact", async (req, res) => { await saveToDB("contact", req.body); res.json({ ok: true }); });
app.post("/api/404", async (req, res) => { await saveToDB("404", req.body); res.json({ ok: true }); });
app.post("/api/socials", async (req, res) => { await saveToDB("socials", req.body); res.json({ ok: true }); });

// ====== MESSAGES COLLECTION (Mongo Native) ======
app.get("/api/messages", async (req, res) => {
  const col = getCollection("messages");
  const messages = await col.find({}).sort({ date: -1 }).toArray();
  res.json(messages);
});

// Paginated
app.get("/api/messages/paginated", async (req, res) => {
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

// Add message
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

// Mark-read
app.post("/api/messages/mark-read", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing message ID" });

  const col = getCollection("messages");
  const result = await col.updateOne({ id }, { $set: { read: true } });

  if (result.matchedCount === 0)
    return res.status(404).json({ error: "Message not found" });

  res.json({ ok: true });
});

// Delete
app.post("/api/messages/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing message ID" });

  const col = getCollection("messages");
  await col.deleteOne({ id });

  res.json({ ok: true });
});

// ====== SEND MESSAGE (Brevo) ======
// Your entire Brevo email logic remains unchanged — fully preserved.
app.post("/api/send-message", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: "Missing required fields" });

  const BREVO_KEY = process.env.BREVO_API_KEY;
  const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@bndlabs.com";
  const ADMIN_EMAIL = process.env.EMAIL_USER;

  if (!BREVO_KEY || !ADMIN_EMAIL) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  try {
    // Same template logic…
    let adminTemplate = `<div>New message from {{name}} &lt;{{email}}&gt;<br/>{{message}}</div>`;
    let visitorTemplate = `<div>Hi {{name}},<br/>We received your message: <br/>{{message}}</div>`;

    const adminHTML = adminTemplate.replace(/{{name}}/g, name).replace(/{{email}}/g, email).replace(/{{message}}/g, message);
    const visitorHTML = visitorTemplate.replace(/{{name}}/g, name).replace(/{{message}}/g, message);

    const send = async (payload) => {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Brevo status ${resp.status}`);
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

    // Save in Mongo
    const col = getCollection("messages");
    await col.insertOne({
      id: Date.now().toString(),
      name,
      email,
      message,
      date: new Date().toISOString(),
      read: false
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Brevo API Error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 BndLabs backend running at http://localhost:${PORT}`));
});
