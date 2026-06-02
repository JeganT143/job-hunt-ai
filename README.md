# Job Hunt AI

A personal job-search command centre built with Next.js 14, Prisma, SQLite, and an AI career coach powered by OpenRouter.

Track applications, manage prep topics, schedule todos, and get context-aware coaching — all in one place.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/job-hunt-ai)

---

## Features

- **Applications tracker** — Kanban + list view with interview rounds and contacts
- **Prep board** — Drag-and-drop study topics by category and status
- **Weekly calendar** — Todo management with a calendar view
- **AI career coach** — Slash-command chat (`/status`, `/prep-plan`, `/draft-email`, `/interview-prep`, `/weekly-review`, `/todo-suggest`)
- **Dashboard** — Metric cards, application-status donut, weekly activity chart
- **Dark mode** — System-preference aware theme toggle

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm 9+

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/job-hunt-ai.git
cd job-hunt-ai
npm install
```

### 2. Configure environment variables

Copy the template and fill in your keys:

```bash
cp .env.local.template .env.local
```

Edit `.env.local`:

```env
# Required — get a free key at https://openrouter.ai
OPENROUTER_API_KEY=sk-or-v1-...

# SQLite database path (default works locally)
DATABASE_URL=file:./dev.db
```

See [Environment Variables](#environment-variables) for the full reference.

### 3. Set up the database

```bash
# Push schema to SQLite and generate the Prisma client
npx prisma db push

# (Optional) Seed with sample data so the app looks good on first launch
npx prisma db seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for the AI chat feature. Get one free at [openrouter.ai](https://openrouter.ai). |
| `DATABASE_URL` | No | SQLite connection URL. Defaults to `file:./dev.db` (project root). In production set this to a persistent volume path, e.g. `file:/app/prisma/prod.db`. |

---

## Deployment

### Railway (recommended)

Railway gives you a persistent SQLite volume, zero-config builds, and a free tier.

1. **Click the deploy button** at the top of this README (update the template URL with your repo first).
2. In the Railway dashboard, add a **Volume** mounted at `/app/prisma`.
3. Set the environment variable `DATABASE_URL=file:/app/prisma/prod.db`.
4. Set `OPENROUTER_API_KEY` to your key.
5. Railway will run `npx prisma generate && npx prisma db push && npm run build` automatically on each deploy.

The `railway.json` in this repo pre-configures the build and start commands.

### Docker

Build and run locally or on any container host:

```bash
# Build
docker build -t job-hunt-ai .

# Run (mount a local directory for persistent DB)
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/prisma \
  -e DATABASE_URL=file:/app/prisma/prod.db \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  job-hunt-ai
```

### Vercel

> Note: Vercel's serverless environment does not persist files between requests. Use Railway or Docker for SQLite persistence. If you need Vercel, swap the datasource to a Postgres provider (Neon, Supabase) and update the Prisma schema accordingly.

---

## Database

The app uses SQLite via the `@libsql/client` adapter. Schema lives in `prisma/schema.prisma`.

Useful commands:

```bash
# Apply schema changes
npx prisma db push

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Re-seed the database
npx prisma db seed

# Reset and re-seed
npx prisma db push --force-reset && npx prisma db seed
```

---

## Health Check

`GET /api/health` — returns app status and record counts:

```json
{
  "status": "ok",
  "timestamp": "2026-06-02T10:00:00.000Z",
  "counts": {
    "applications": 3,
    "interviews": 1,
    "prepTopics": 5,
    "todos": 5,
    "contacts": 1
  }
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite via `@libsql/client` |
| ORM | Prisma 7 |
| AI | OpenRouter (`minimax/minimax-m3`) |
| Charts | Recharts |
| Drag & Drop | dnd-kit |
| Icons | Lucide React |
