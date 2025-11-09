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

// ====== CORS ======
app.use(cors({
  origin: [
    "https://bndlabs.netlify.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ====== Helpers ======
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

// ====== ROUTES (READ) ======
app.get("/api/home", (req, res) => res.json(readJSON("home.json", {})));
app.get("/api/projects", (req, res) => res.json(readJSON("projects.json", [])));
app.get("/api/blogs", (req, res) => res.json(readJSON("blogs.json", [])));
app.get("/api/profile", (req, res) => res.json(readJSON("profile.json", {})));
app.get("/api/about", (req, res) => res.json(readJSON("about.json", {})));
app.get("/api/contact", (req, res) => res.json(readJSON("contact.json", {})));
app.get("/api/404", (req, res) => res.json(readJSON("404.json", {})));

// ====== NEW: SOCIALS ROUTE ======
app.get("/api/socials", (req, res) => {
  // Try to read from a local file first (socials.json)
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

// (Optional) — write endpoint for socials
app.post("/api/socials", (req, res) => { writeJSON("socials.json", req.body); res.json({ ok: true }); });

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BndLabs backend running on http://localhost:${PORT}`);
});
