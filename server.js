// ====== BNDLABS BACKEND SERVER ======
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const app = express();

// ====== JSON PARSER ======
app.use(express.json());

// ====== CORS FOR RENDER ======
app.use(cors({
  origin: ["https://bndlabs-frontend.onrender.com"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

app.options("*", cors()); // Required

// ====== PATH FIX ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ====== Helpers ======
const readJSON = (file, fallback) => {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const writeJSON = (file, data) => {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
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

// ====== PAGINATED MESSAGES ======
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

// ====== SAVE MESSAGE ======
app.post("/api/messages", (req, res) => {
  const list = readJSON("messages.json", []);
  list.push(req.body);
  writeJSON("messages.json", list);
  res.json({ ok: true });
});

// ====== MARK MESSAGE READ ======
app.post("/api/messages/mark-read", (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "Missing ID" });

  const list = readJSON("messages.json", []);
  const index = list.findIndex(m => m.id == id);

  if (index === -1) {
    return res.status(404).json({ error: "Message not found" });
  }

  list[index].read = true;
  writeJSON("messages.json", list);

  res.json({ ok: true });
});

// ====== DELETE MESSAGE ======
app.post("/api/messages/delete", (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "Missing ID" });

  let list = readJSON("messages.json", []);
  list = list.filter(m => m.id != id);

  writeJSON("messages.json", list);

  res.json({ ok: true });
});

// ====== BREVO API EMAIL SENDER ======
app.post("/api/send-message", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const apiKey = process.env.BREVO_API_KEY;

    // Load templates
    const adminTemplate = fs.readFileSync(
      path.join(__dirname, "email-templates", "admin-email.html"),
      "utf8"
    );
    const visitorTemplate = fs.readFileSync(
      path.join(__dirname, "email-templates", "visitor-email.html"),
      "utf8"
    );

    // Generate HTML
    const adminHTML = adminTemplate
      .replace(/{{name}}/g, name)
      .replace(/{{email}}/g, email)
      .replace(/{{message}}/g, message);

    const visitorHTML = visitorTemplate
      .replace(/{{name}}/g, name)
      .replace(/{{email}}/g, email)
      .replace(/{{message}}/g, message);

    // Send ADMIN email
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "bndlabs", email: process.env.EMAIL_USER },
        to: [{ email: process.env.EMAIL_USER }],
        subject: `New message from ${name}`,
        htmlContent: adminHTML,
      }),
    });

    // Send VISITOR email
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "bndlabs", email: process.env.EMAIL_USER },
        to: [{ email }],
        subject: `Your message was received by bndlabs`,
        htmlContent: visitorHTML,
      }),
    });

    // Save message to database
    const list = readJSON("messages.json", []);
    list.push({
      id: Date.now(),
      name,
      email,
      message,
      date: new Date().toISOString(),
      read: false,
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
app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);
