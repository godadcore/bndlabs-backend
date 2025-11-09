console.log("✅ Data directory absolute path:", path.join(process.cwd(), "data"));
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Absolute path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

// CORS fix
app.use(cors({
  origin: [
    "https://bndlabs.netlify.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Helper functions
const readJSON = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  } catch {
    return fallback;
  }
};
const writeJSON = (file, data) => {
    fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data ?? {}, null, 2));
};

// === ROUTES (READ) ===
app.get("/api/home", (req, res) => res.json(readJSON("home.json", {})));
app.get("/api/projects", (req, res) => res.json(readJSON("projects.json", [])));
app.get("/api/blogs", (req, res) => res.json(readJSON("blogs.json", [])));
app.get("/api/profile", (req, res) => res.json(readJSON("profile.json", {})));
app.get("/api/about", (req, res) => res.json(readJSON("about.json", {})));
app.get("/api/contact", (req, res) => res.json(readJSON("contact.json", {})));
app.get("/api/404", (req, res) => res.json(readJSON("404.json", {})));

// === ROUTES (WRITE) ===
app.post("/api/home", (req, res) => { writeJSON("home.json", req.body); res.json({ ok: true }); });
app.post("/api/projects", (req, res) => { writeJSON("projects.json", req.body); res.json({ ok: true }); });
app.post("/api/blogs", (req, res) => { writeJSON("blogs.json", req.body); res.json({ ok: true }); });
app.post("/api/profile", (req, res) => { writeJSON("profile.json", req.body); res.json({ ok: true }); });
app.post("/api/about", (req, res) => { writeJSON("about.json", req.body); res.json({ ok: true }); });
app.post("/api/contact", (req, res) => { writeJSON("contact.json", req.body); res.json({ ok: true }); });
app.post("/api/404", (req, res) => { writeJSON("404.json", req.body); res.json({ ok: true }); });

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BndLabs backend running on http://localhost:${PORT}`);
});
