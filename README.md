# PropPilot AI

**An Autonomous Multi-Agent Lead Conversion Platform for Real Estate**

PropPilot AI automates the entire real estate lead nurturing workflow using AI agents. From lead qualification and scoring to property matching and WhatsApp follow-up, the platform ensures no lead is forgotten.

## 🚀 Features

- **🤖 AI Agent Suite** — Lead Qualification, Scoring, Property Recommendation, and Journey Builder agents powered by Google Gemini
- **🔄 LangGraph Workflow** — Orchestrated multi-agent pipeline that processes leads autonomously end-to-end
- **📊 Smart Dashboard** — Real-time lead metrics, conversion rates, and AI insights, all pulled from a single consistent data source
- **💬 WhatsApp Follow-up** — AI-generated follow-up messages come with a ready-to-send `wa.me` deep link, pre-filled and one click from sending
- **🏠 Property Management** — Property inventory with smart matching against lead budget, location, and type
- **📅 Appointment Scheduling** — Site visit management
- **📈 Analytics** — Lead source breakdown, pipeline stage distribution, and hot/warm/cold segmentation
- **🔐 Authentication** — JWT-based auth
- **🌙 Dark SaaS UI** — Professional dark theme with responsive design

## 🏗️ Architecture
Frontend (Next.js 15)
↓
FastAPI Backend
↓
LangGraph Workflow
↓
Gemini AI (Google)
↓
SQLite (proppilot.db)

### AI Agents

1. **Lead Qualification Agent** — Parses customer inquiries to extract name, budget, location, property type, and timeline
2. **Lead Scoring Agent** — Assigns a score (0–100) and priority (Hot/Warm/Cold) with reasoning
3. **Property Recommendation Agent** — Matches leads with best-fit properties from inventory
4. **AI Journey Builder / Nurturing Agent** — Generates a personalized WhatsApp follow-up message and a ready-to-send link

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui, TanStack Query |
| Backend | FastAPI, Python, SQLAlchemy (async), LangGraph |
| AI | Google Gemini |
| Database | SQLite (default, via aiosqlite) — swappable for PostgreSQL/Supabase |
| Auth | JWT-based auth |
| Charts | Recharts |
| Deployment | Vercel (frontend), Railway (backend) |

## 📁 Project Structure


proppilot-ai/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints/          # FastAPI route handlers
│   │   │
│   │   ├── core/                       # Config, auth, database
│   │   │
│   │   ├── db/
│   │   │   └── repositories/           # Data access layer
│   │   │
│   │   ├── models/                     # SQLAlchemy ORM models
│   │   │
│   │   ├── prompts/                    # Gemini AI prompt templates
│   │   │
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   │
│   │   ├── services/
│   │   │   ├── agents/                 # Individual AI agents
│   │   │   └── workflows/              # LangGraph orchestration
│   │   │
│   │   └── main.py                     # FastAPI entry point
│   │
│   ├── seed_properties.py              # Seed demo property inventory
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/                        # Next.js App Router pages
│   │   ├── components/                 # React UI components
│   │   ├── lib/                        # Utilities & API client
│   │   ├── types/                      # TypeScript definitions
│   │   └── styles/                     # Global CSS
│   │
│   ├── Dockerfile
│   └── package.json
│
├── deployment/
│   ├── docker-compose.yml
│   └── vercel.json
│
├── docs/
│   └── schema.sql                      # Database schema
│
└── README.md


## 🚦 Getting Started

### Prerequisites

- Python 3.11+ (tested on 3.13)
- Node.js 20+
- Google Gemini API key
- No separate database server needed — uses SQLite out of the box

### Backend Setup

**Windows (PowerShell):**

```powershell
cd backend

# Create and activate virtual environment
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy env file and configure
copy .env.example .env
# Edit .env with your GOOGLE_API_KEY (other values have working defaults for local dev)

# Seed sample properties (optional, recommended for demos)
python seed_properties.py

# Start server
python -m uvicorn app.main:app --reload
```

**macOS / Linux:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python seed_properties.py
uvicorn app.main:app --reload
```

Database tables are created automatically on startup — no separate migration step is needed for local SQLite development.

Once running, visit `http://localhost:8000/docs` to confirm the API is up and browse available endpoints.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit with your backend URL
npm run dev
```

### Docker Setup

```bash
cd deployment
docker-compose up -d
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Register |
| GET | `/api/v1/leads` | List leads |
| POST | `/api/v1/leads` | Create lead |
| POST | `/api/v1/leads/inquiry` | Public property inquiry intake (triggers full AI workflow) |
| GET | `/api/v1/leads/dashboard` | Dashboard stats |
| GET | `/api/v1/leads/{id}` | Get lead |
| PATCH | `/api/v1/leads/{id}` | Update lead |
| POST | `/api/v1/leads/{id}/qualify` | Run qualification agent |
| POST | `/api/v1/leads/{id}/score` | Run scoring agent |
| POST | `/api/v1/leads/{id}/recommend` | Get property recommendations |
| POST | `/api/v1/leads/{id}/journey` | Generate follow-up journey |
| POST | `/api/v1/leads/{id}/workflow` | Execute full AI workflow |
| GET | `/api/v1/leads/{id}/activities` | Get lead activity timeline |
| GET/POST | `/api/v1/properties` | Property CRUD |
| GET/POST | `/api/v1/appointments` | Appointment CRUD |

## 🤖 AI Workflow

1. **Lead Created** → Qualification Agent extracts structured data from the inquiry
2. **Qualified** → Scoring Agent calculates a lead score (0–100) and priority
3. **Scored** → Recommendation Agent finds best-fit properties
4. **Nurturing** → Agent generates a WhatsApp follow-up message and a pre-filled `wa.me` link, logged to the Activity Timeline with a one-click "Send on WhatsApp" button

## 📊 Dashboard

- Today's inquiries, new leads, qualified leads, hot leads
- Pending follow-ups, WhatsApp messages generated, site visits, bookings, conversion rate
- Lead source breakdown and pipeline stage distribution
- Recent activity feed sourced from the same event log driving the Activity Timeline

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend type check
cd frontend
npx tsc --noEmit
```

## 🌐 Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Railway)

```bash
cd backend
railway up
```

## 🔑 Environment Variables

See `backend/.env.example` and `frontend/.env.local.example` for all variables.

### Backend (`backend/.env`)

- `DATABASE_URL` — defaults to `sqlite+aiosqlite:///./proppilot.db` for local dev; swap for a PostgreSQL URL in production
- `GOOGLE_API_KEY` — **required** — Google Gemini API key
- `SECRET_KEY` — JWT signing secret (use a real secret in production)
- `CORS_ORIGINS` — JSON array of allowed frontend origins, e.g. `["http://localhost:3000"]`. If your frontend runs on a different port (Next.js auto-picks the next free port if 3000 is taken), add that port too, e.g. `["http://localhost:3000","http://localhost:3001"]`
- `SUPABASE_*` — only required if you switch auth/storage to Supabase; safe to leave as placeholder values for local SQLite development

### Frontend (`frontend/.env.local`)

- `NEXT_PUBLIC_API_URL` — should point to your running backend, e.g. `http://localhost:8000/api/v1`

## 🧯 Troubleshooting

- **"Failed to fetch" / CORS errors in the browser console** — usually means the frontend is running on a different port than what's listed in `CORS_ORIGINS`. Check the actual URL in your browser's address bar, add that origin to `CORS_ORIGINS` in `backend/.env`, then **restart** the backend (env vars are only read on startup).
- **`pip install` fails with a dependency resolution error** — check which two packages conflict in the error output; version pins may need adjusting depending on your Python version.
- **`No module named uvicorn` after installing** — if a previous `pip install` run failed partway through, nothing gets installed at all. Fix the failing line in `requirements.txt` and re-run.
- **SQLAlchemy import errors on Python 3.13** — make sure `sqlalchemy>=2.0.36`; earlier 2.0.x releases don't support Python 3.13.
- **Properties page fails to load / 500 error** — usually a stale seed. Clear and re-seed:
```bash
  python -c "import sqlite3; c = sqlite3.connect('proppilot.db'); c.execute('DELETE FROM properties'); c.commit()"
  python seed_properties.py
```

## 🤝 Contributing

This is a hackathon MVP. Contributions, issues, and feature requests are welcome!

## 📄 License

MIT