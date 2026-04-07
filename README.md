# AI Career Guidance System

An AI-driven web application providing personalized career and academic guidance for pre-university students in Zimbabwe. Students complete a career assessment and receive tailored recommendations, program matches, and AI-powered advice.

## Prerequisites

- **Node.js** 18+ (24 recommended)
- **pnpm** (package manager)
- **Ollama** (for AI advice — optional but recommended)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up the database

```bash
# Push schema to SQLite (creates data/aicareerguide.db)
pnpm --filter @workspace/db run push

# Seed careers, programs, and admin user
pnpm --filter @workspace/scripts run seed
```

### 3. (Optional) Add TelOne programs

```bash
pnpm --filter @workspace/scripts run seed-telone
```

### 4. Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

Runs on **http://localhost:8081**

### 5. Start the frontend

In a new terminal:

```bash
pnpm --filter @workspace/career-guidance run dev
```

Runs on **http://localhost:5173** (proxies `/api` to the backend)

---

## Running Both Services

Use two terminals:

| Terminal 1 | Terminal 2 |
|------------|------------|
| `pnpm --filter @workspace/api-server run dev` | `pnpm --filter @workspace/career-guidance run dev` |

Then open **http://localhost:5173** in your browser.

---

## Environment Variables

Create a `.env` file in the project root (optional):

```env
# Database (default: data/aicareerguide.db)
# DATABASE_URL=file:./data/aicareerguide.db

# Ollama (for AI career advice)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b

# Ports (optional)
# PORT=8081          # API server
# PORT=5173          # Frontend (via career-guidance)
```

## Ollama Setup (AI Advice)

For AI-generated career advice:

1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull gemma3:1b`
3. Ensure Ollama is running (default: http://localhost:11434)

Without Ollama, the app still works; AI advice will be skipped.

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm --filter @workspace/api-server run dev` | Start API server (port 8081) |
| `pnpm --filter @workspace/career-guidance run dev` | Start frontend (port 5173) |
| `pnpm --filter @workspace/scripts run seed` | Seed database (programs, admin) |
| `pnpm --filter @workspace/scripts run seed-telone` | Add TelOne Centre for Learning programs |
| `pnpm --filter @workspace/scripts run fix-mbchb` | Update MBChB to "at least 3 of 4" subjects |
| `pnpm --filter @workspace/db run push` | Push schema to database |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client after OpenAPI changes |

---

## Admin Access

After seeding:

- **Admin panel**: http://localhost:5173/admin (when logged in as admin)
- **Email**: admin@careerguide.zw
- **Password**: Admin@123

---

## Project Structure

```
artifacts/
├── api-server/              # Express backend (port 8081)
└── career-guidance/         # React + Vite frontend (port 5173)

lib/
├── api-spec/                # OpenAPI spec + codegen
├── api-client-react/        # Generated React Query hooks
├── api-zod/                 # Generated Zod schemas
└── db/                      # Drizzle schema + SQLite

scripts/
└── src/                     # Seed, migrate, fix scripts
```

---

## Troubleshooting

**Port 8081 already in use**

```bash
# Windows (PowerShell)
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8081
kill -9 <PID>
```

**Database not found**

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
```

**AI advice not showing**

- Ensure Ollama is running: `ollama serve`
- Pull the model: `ollama pull gemma3:1b`
- Check `.env` has `OLLAMA_BASE_URL` and `OLLAMA_MODEL`
