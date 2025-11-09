# BndLabs Backend (Render-ready)

This is a tiny JSON API for your admin to read/write:

- GET/POST `/api/home`
- GET/POST `/api/projects`
- GET/POST `/api/blogs`
- GET/POST `/api/profile`
- GET/POST `/api/about`
- GET/POST `/api/contact`
- GET/POST `/api/404`

## Deploy on Render

1. Push this folder to GitHub as its **own repo** (or as a subfolder and set the root in Render).
2. Create a **New Web Service** on Render.
3. Settings:
   - **Root Directory**: `bndlabs-backend` (if monorepo) or leave blank if repo root.
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

After it deploys, you'll get a URL like:

```
https://bndlabs-backend.onrender.com
```

Use that base URL in your frontend by defining:

```html
<script>
  window.BNDLABS_API_BASE = "https://bndlabs-backend.onrender.com";
</script>
```

Put the above **before** your admin script that bootstraps the Store.
