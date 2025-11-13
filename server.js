// ====== BNDLABS BACKEND SERVER ======
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// ====== JSON BODY PARSER ======
app.use(express.json({ limit: "1mb" }));

// ====== CORS - allow frontend + localhost for testing ======
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

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("📁 Created missing data folder:", dataDir);
}

// ====== Helpers ======
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

// ====== READ ROUTES ======
app.get("/api/home", (req, res) => res.json(readJSON("home.json", {})));
app.get("/api/projects", (req, res) => res.json(readJSON("projects.json", [])));
app.get("/api/blogs", (req, res) => res.json(readJSON("blogs.json", [])));
app.get("/api/profile", (req, res) => res.json(readJSON("profile.json", {})));
app.get("/api/about", (req, res) => res.json(readJSON("about.json", {})));
app.get("/api/contact", (req, res) => res.json(readJSON("contact.json", {})));
app.get("/api/404", (req, res) => res.json(readJSON("404.json", {})));
app.get("/api/socials", (req, res) => res.json(readJSON("socials.json", [])));
app.get("/api/messages", (req, res) => res.json(readJSON("messages.json", [])));

// ====== PAGINATED MESSAGES (ADMIN) ======
app.get("/api/messages/paginated", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const list = readJSON("messages.json", []);
  const start = (page - 1) * limit;
  const end = start + limit;
  res.json({
    page,
    limit,
    total: list.length,
    messages: list.slice(start, end)
  });
});

// ====== WRITE / SAVE ROUTES FOR CMS (Admin) ======
app.post("/api/home", (req, res) => { writeJSON("home.json", req.body); res.json({ ok: true }); });
app.post("/api/projects", (req, res) => { writeJSON("projects.json", req.body); res.json({ ok: true }); });
app.post("/api/blogs", (req, res) => { writeJSON("blogs.json", req.body); res.json({ ok: true }); });
app.post("/api/profile", (req, res) => { writeJSON("profile.json", req.body); res.json({ ok: true }); });
app.post("/api/about", (req, res) => { writeJSON("about.json", req.body); res.json({ ok: true }); });
app.post("/api/contact", (req, res) => { writeJSON("contact.json", req.body); res.json({ ok: true }); });
app.post("/api/404", (req, res) => { writeJSON("404.json", req.body); res.json({ ok: true }); });
app.post("/api/socials", (req, res) => { writeJSON("socials.json", req.body); res.json({ ok: true }); });

// ====== MESSAGES: save, mark-read, delete ======
app.post("/api/messages", (req, res) => {
  const list = readJSON("messages.json", []);
  const payload = {
    id: Date.now().toString(),
    name: req.body.name || "",
    email: req.body.email || "",
    message: req.body.message || "",
    date: new Date().toISOString(),
    read: false
  };
  list.unshift(payload); // newest first
  writeJSON("messages.json", list);
  res.json({ ok: true, item: payload });
});

app.post("/api/messages/mark-read", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing message ID" });
  const list = readJSON("messages.json", []);
  const idx = list.findIndex(m => m.id == id);
  if (idx === -1) return res.status(404).json({ error: "Message not found" });
  list[idx].read = true;
  writeJSON("messages.json", list);
  res.json({ ok: true });
});

app.post("/api/messages/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing message ID" });
  let list = readJSON("messages.json", []);
  list = list.filter(m => m.id != id);
  writeJSON("messages.json", list);
  res.json({ ok: true });
});

// ====== SEND MESSAGE (Brevo API) ======
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
    // Load optional templates (fall back to simple HTML if not present)
    let adminTemplate = `<div>New message from {{name}} &lt;{{email}}&gt;<br/>{{message}}</div>`;
    let visitorTemplate = `<div>Hi {{name}},<br/>We received your message: <br/>{{message}}</div>`;
    const adminPath = path.join(__dirname, "email-templates", "admin-email.html");
    const visitorPath = path.join(__dirname, "email-templates", "visitor-email.html");

    if (fs.existsSync(adminPath)) adminTemplate = fs.readFileSync(adminPath, "utf8");
    if (fs.existsSync(visitorPath)) visitorTemplate = fs.readFileSync(visitorPath, "utf8");

    const adminHTML = adminTemplate.replace(/{{name}}/g, name).replace(/{{email}}/g, email).replace(/{{message}}/g, message);
    const visitorHTML = visitorTemplate.replace(/{{name}}/g, name).replace(/{{email}}/g, email).replace(/{{message}}/g, message);

    // Send admin email
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

    await send({
      sender: { name: "bndlabs", email: FROM_EMAIL },
      to: [{ email: ADMIN_EMAIL }],
      subject: `New message from ${name}`,
      htmlContent: adminHTML
    });

    // Send visitor email
    await send({
      sender: { name: "bndlabs", email: FROM_EMAIL },
      to: [{ email }],
      subject: `Thanks — we got your message`,
      htmlContent: visitorHTML
    });

    // Save message in messages.json
    const list = readJSON("messages.json", []);
    list.unshift({
      id: Date.now().toString(),
      name,
      email,
      message,
      date: new Date().toISOString(),
      read: false
    });
    writeJSON("messages.json", list);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Brevo API Error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BndLabs backend running at http://localhost:${PORT}`);
});
