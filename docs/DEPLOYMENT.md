# Deploying Catch the Phish

Frontend (React) → **Vercel**. Backend (FastAPI) → **Render**. Deploy the backend first so
you know its URL, then give that URL to the frontend.

## 1. Backend on Render

1. Push this repository to GitHub.
2. Render dashboard → **New → Blueprint** → choose the repository. It reads `render.yaml`.
3. When prompted, leave `CORS_ORIGINS` empty for now (you will set it in step 3 below).
   `AUTH_SECRET_KEY` is generated for you; `APP_ENV=production` is already set.
4. After the first deploy, open `https://<your-service>.onrender.com/api/health`.
   You should see `{"status":"healthy","ml_model_loaded":true,...}`.

Notes
- In production the backend **refuses to start** without a strong `AUTH_SECRET_KEY`, never seeds
  demo data, and never creates the demo admin account.
- SQLite on Render's free plan is **ephemeral**: history and user feedback reset on every
  deploy/restart. For persistence use PostgreSQL (see "Persistent database" below).
- The free plan sleeps when idle; the first request after a pause takes ~30–60 s.
- To create an administrator (needed for clearing global scan history), register a user, then
  change `role` to `admin` for that row in the database.

## Persistent database (free Postgres)

The backend uses SQLite by default and switches to Postgres whenever `DATABASE_URL` is a
`postgres://` or `postgresql://` address. Tables are created automatically on startup.

Recommended free option: **Neon** (https://neon.tech). Its free database does not expire.
(Render's own free Postgres is deleted after 30 days.)

1. Create a Neon project and copy its **connection string** (it ends in `?sslmode=require`).
2. Render dashboard -> your service -> **Environment** -> set `DATABASE_URL` to that string.
   Keep it secret: never commit it or paste it into chat or a file in this repository.
3. Save. Render redeploys. Check `/api/health` and run one scan, then confirm the row appears
   in the Neon dashboard's table viewer (`scan_records`).

Existing SQLite history is not migrated; the new database starts empty.

## 2. Frontend on Vercel

The project is already linked (`frontend/.vercel/project.json`). In the Vercel project settings,
add the environment variable (Production **and** Preview):

```
VITE_API_URL = https://<your-service>.onrender.com/api
```

Then deploy from the `frontend` folder:

```bash
cd frontend
npx vercel --prod
```

(Vite reads `VITE_API_URL` at build time, so redeploy after changing it.)

## 3. Connect them

Back on Render, set `CORS_ORIGINS` to your Vercel URL(s), comma-separated, no trailing slash:

```
CORS_ORIGINS = https://your-app.vercel.app
```

Redeploy the Render service (or let it restart). Browsers will now be allowed to call the API.

## Checklist

- [ ] `/api/health` is healthy on Render
- [ ] `VITE_API_URL` set on Vercel, frontend redeployed
- [ ] `CORS_ORIGINS` set on Render to the exact Vercel origin
- [ ] A scan on the live site returns a result from the real backend
