// ====== BNDLABS BACKEND SERVER ======
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// ====== Absolute path fix ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

// Confirm data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("📁 Created missing data folder:", dataDir);
}

console.log("✅ Data directory absolute path:", dataDir);

// ====== CORS CONFIG (FIXED) ======
app.use(
  cors({
origin: [
  "https://bndlabs-frontend.onrender.com",
  "https://bndlabs.netlify.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
],

    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  })
);

app.use(express.json());

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

// ====== ROUTES (READ) ======
app.get("/api/home", (req, res) => res.json(readJSON("home.json", {})));
app.get("/api/projects", (req, res) => res.json(readJSON("projects.json", [])));
app.get("/api/blogs", (req, res) => res.json(readJSON("blogs.json", [])));
app.get("/api/profile", (req, res) => res.json(readJSON("profile.json", {})));
app.get("/api/about", (req, res) => res.json(readJSON("about.json", {})));
app.get("/api/contact", (req, res) => res.json(readJSON("contact.json", {})));
app.get("/api/404", (req, res) => res.json(readJSON("404.json", {})));
// ====== MESSAGES ROUTE (READ) ======
app.get("/api/messages", (req, res) => {
  res.json(readJSON("messages.json", []));
});

// ====== SOCIALS ROUTE ======
app.get("/api/socials", (req, res) => {
  const socials = readJSON("socials.json", [
    {
      platform: "X",
      url: "https://twitter.com/yourhandle",
      svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M22.46 6c-.77.35-1.5.59-2.3.69a4.1 4.1 0 001.8-2.27 8.2 8.2 0 01-2.6 1A4.07 4.07 0 0016 4a4.08 4.08 0 00-4.06 4.07c0 .32.04.63.1.93A11.6 11.6 0 013 5.13a4.1 4.1 0 001.27 5.44 4.1 4.1 0 01-1.84-.5v.05c0 2.03 1.45 3.73 3.38 4.12-.35.1-.73.15-1.12.15-.27 0-.54-.03-.8-.08.55 1.7 2.12 2.93 3.98 2.97A8.2 8.2 0 012 19.54 11.56 11.56 0 008.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.36 8.36 0 0022.46 6z'/></svg>"
    },
    {
      platform: "Instagram",
      url: "https://instagram.com/yourhandle",
      svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm6.5-.75a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z'/></svg>"
    },
    {
      platform: "LinkedIn",
      url: "https://linkedin.com/in/yourhandle",
      svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4.98 3A2 2 0 003 5v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H4.98zM8 17H6V9h2v8zm-1-9a1 1 0 110-2 1 1 0 010 2zm11 9h-2v-4.5c0-1.33-2-1.22-2 0V17h-2V9h2v1.3c.73-.95 4-1.02 4 1.73V17z'/></svg>"
    }
  ]);
  res.json(socials);
});

// ====== ROUTES (WRITE) ======
app.post("/api/home", (req, res) => { writeJSON("home.json", req.body); res.json({ ok: true }); });
app.post("/api/projects", (req, res) => { writeJSON("projects.json", req.body); res.json({ ok: true }); });
app.post("/api/blogs", (req, res) => { writeJSON("blogs.json", req.body); res.json({ ok: true }); });
app.post("/api/profile", (req, res) => { writeJSON("profile.json", req.body); res.json({ ok: true }); });
app.post("/api/about", (req, res) => { writeJSON("about.json", req.body); res.json({ ok: true }); });
app.post("/api/contact", (req, res) => { writeJSON("contact.json", req.body); res.json({ ok: true }); });
app.post("/api/404", (req, res) => { writeJSON("404.json", req.body); res.json({ ok: true }); });
app.post("/api/socials", (req, res) => { writeJSON("socials.json", req.body); res.json({ ok: true }); });
// ====== MESSAGES ROUTE (WRITE) ======
app.post("/api/messages", (req, res) => {
  const list = readJSON("messages.json", []);
  list.push(req.body);
  writeJSON("messages.json", list);
  res.json({ ok: true });
});
// ========== MARK MESSAGE AS READ ==========
app.post("/api/messages/mark-read", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing message ID" });

  const list = readJSON("messages.json", []);
  const index = list.findIndex(m => m.id == id);

  if (index === -1) return res.status(404).json({ error: "Message not found" });

  list[index].read = true;
  writeJSON("messages.json", list);

  res.json({ ok: true, message: "Message marked as read" });
});

// ========== DELETE MESSAGE ==========
app.post("/api/messages/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing message ID" });

  let list = readJSON("messages.json", []);
  list = list.filter(m => m.id != id);
  writeJSON("messages.json", list);

  res.json({ ok: true, message: "Message deleted" });
});

// ========== PAGINATED MESSAGES ==========
app.get("/api/messages/paginated", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

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

// ====== EMAIL NOTIFICATION (CONTACT FORM) ======
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});


// ====== EMAIL NOTIFICATION (CONTACT FORM) ======
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

app.post("/api/send-message", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: "Missing required fields" });

  try {

    // ====== LOAD EMAIL TEMPLATES ======
    const adminTemplate = fs.readFileSync(
      path.join(__dirname, "email-templates", "admin-email.html"),
      "utf8"
    );

    const visitorTemplate = fs.readFileSync(
      path.join(__dirname, "email-templates", "visitor-email.html"),
      "utf8"
    );

    // ====== APPLY VARIABLES ======
    const adminHTML = adminTemplate
      .replace(/{{name}}/g, name)
      .replace(/{{email}}/g, email)
      .replace(/{{message}}/g, message);

    const visitorHTML = visitorTemplate
      .replace(/{{name}}/g, name)
      .replace(/{{email}}/g, email)
      .replace(/{{message}}/g, message);

    // ====== SEND TO ADMIN ======
    await transporter.sendMail({
      from: `"bndlabs" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New message from ${name}`,
      html: adminHTML
    });

    // ====== SEND TO VISITOR ======
    await transporter.sendMail({
      from: `"bndlabs" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your message was received by bndlabs`,
      html: visitorHTML
    });

    // ====== SAVE MESSAGE ======
    const list = readJSON("messages.json", []);
    list.push({
      id: Date.now(),
      name,
      email,
      message,
      date: new Date().toISOString(),
      read: false
    });
    writeJSON("messages.json", list);

    res.json({ ok: true, message: "Emails sent successfully" });

  } catch (err) {
    console.error("❌ Mail error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});


// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BndLabs backend running at http://localhost:${PORT}`);
});
