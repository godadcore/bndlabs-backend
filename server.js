// server.js
import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors({
  origin: [
    "https://bndlabs.netlify.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// === ROUTES (READ) ===
app.get("/api/home", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/home.json", "utf8"));
    res.json(data);
  } catch (e) {
    res.json({});
  }
});
app.get("/api/projects", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/projects.json", "utf8"));
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});
app.get("/api/blogs", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/blogs.json", "utf8"));
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});
app.get("/api/profile", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/profile.json", "utf8"));
    res.json(data);
  } catch (e) {
    res.json({});
  }
});
app.get("/api/about", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/about.json", "utf8"));
    res.json(data);
  } catch (e) {
    res.json({});
  }
});
app.get("/api/contact", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/contact.json", "utf8"));
    res.json(data);
  } catch (e) {
    res.json({});
  }
});
app.get("/api/404", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync("./data/404.json", "utf8"));
    res.json(data);
  } catch (e) {
    res.json({});
  }
});

// === ROUTES (WRITE) ===
function writeJSON(path, body) {
  fs.writeFileSync(path, JSON.stringify(body ?? {}, null, 2));
}
app.post("/api/home", (req, res) => { writeJSON("./data/home.json", req.body); res.json({ok:true}); });
app.post("/api/projects", (req, res) => { writeJSON("./data/projects.json", req.body); res.json({ok:true}); });
app.post("/api/blogs", (req, res) => { writeJSON("./data/blogs.json", req.body); res.json({ok:true}); });
app.post("/api/profile", (req, res) => { writeJSON("./data/profile.json", req.body); res.json({ok:true}); });
app.post("/api/about", (req, res) => { writeJSON("./data/about.json", req.body); res.json({ok:true}); });
app.post("/api/contact", (req, res) => { writeJSON("./data/contact.json", req.body); res.json({ok:true}); });
app.post("/api/404", (req, res) => { writeJSON("./data/404.json", req.body); res.json({ok:true}); });

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BndLabs backend running on http://localhost:${PORT}`);
});
