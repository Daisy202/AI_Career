# AI Career Guidance System

AI-assisted web app for **pre-university students in Zimbabwe**: career assessment, program matching, recommendations, and optional **local LLM** advice via [Ollama](https://ollama.ai).

**Repository:** [github.com/Daisy202/AI_Career](https://github.com/Daisy202/AI_Career)

## Features

- Student **sign up / login** and **profile** (subjects, goals)
- **Career assessment** and **recommendations** with program matching
- **AI career chat** (when Ollama is running)
- **Admin** tools for managing content (seeded admin user for local dev)

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 19, Vite 7, Tailwind, Wouter |
| Backend | Express 5, session cookies |
| Data | SQLite (file), Drizzle ORM |
| AI (optional) | Ollama (e.g. Gemma) |

## Prerequisites

- **Node.js** 18+ (24 LTS recommended)
- **[pnpm](https://pnpm.io)** — this repo expects `pnpm` (npm/yarn are blocked by `preinstall`)
- **Ollama** — optional; needed for AI-generated advice

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/Daisy202/AI_Career.git
cd AI_Career
pnpm install
```

### 2. Environment (optional)

Copy the example env file and edit if needed:

```bash
cp .env.example .env
```

Key variables (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `OLLAMA_BASE_URL` | Default `http://localhost:11434` |
| `OLLAMA_MODEL` | e.g. `gemma3:1b` |
| `PORT` | API port (default **8081**) |

### 3. Database

Creates `data/aicareerguide.db` (local only; `*.db` is gitignored).

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
```

### 4. (Optional) TelOne Centre for Learning programs

```bash
pnpm --filter @workspace/scripts run seed-telone
```

### 5. Run API + frontend

**Terminal 1 — API (port 8081)**

```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — UI (port 5173, proxies `/api`)**

```bash
pnpm --filter @workspace/career-guidance run dev
```

Open **http://localhost:5173**.

---

## Ollama (AI advice)

1. Install [Ollama](https://ollama.ai).
2. Pull a model: `ollama pull gemma3:1b`
3. Run the daemon (usually automatic): `ollama serve`

Without Ollama, the rest of the app still works; AI responses may be omitted or degraded.

---

## Scripts reference

| Command | Description |
|---------|-------------|
| `pnpm --filter @workspace/api-server run dev` | API dev server |
| `pnpm --filter @workspace/career-guidance run dev` | Frontend dev server |
| `pnpm --filter @workspace/db run push` | Apply Drizzle schema to SQLite |
| `pnpm --filter @workspace/scripts run seed` | Seed careers, programs, admin user |
| `pnpm --filter @workspace/scripts run seed-telone` | Add TelOne programs |
| `pnpm --filter @workspace/scripts run migrate-sqlite` | Legacy/raw SQL migration helper |
| `pnpm --filter @workspace/scripts run fix-mbchb` | Data fix: MBChB subject rule |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate clients from OpenAPI |

Root: `pnpm run build` — typecheck + package builds.

---

## Admin (local dev)

After `seed`:

| | |
|--|--|
| URL | http://localhost:5173/admin (when logged in as admin) |
| Email | `admin@careerguide.zw` |
| Password | `Admin@123` |

Change these before any real deployment.

---

## Project layout

```
artifacts/
├── api-server/           # Express API
└── career-guidance/      # React + Vite SPA

lib/
├── api-spec/             # OpenAPI + Orval codegen
├── api-client-react/     # Generated React Query client
├── api-zod/              # Generated Zod types
└── db/                   # Drizzle schema

scripts/                  # seed, migrate, fixes
```

---

## Troubleshooting

**Port 8081 in use (Windows PowerShell)**

```powershell
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

**Missing or empty database**

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
```

**No AI text in chat**

- Ollama running: `ollama serve`
- Model pulled: `ollama pull <your-model>`
- `.env` matches `OLLAMA_BASE_URL` and `OLLAMA_MODEL`

---

## License

MIT (see root `package.json`).
