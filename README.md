<<<<<<< HEAD
# PropPilot AI

**An Autonomous Multi-Agent Lead Conversion Platform for Real Estate**

PropPilot AI automates the entire real estate lead nurturing workflow using AI Agents. From lead qualification to journey building and follow-up automation, the platform ensures no lead is forgotten.

## 🚀 Features

- **🤖 AI Agent Suite** - Lead Qualification, Scoring, Property Recommendation, and Journey Builder agents powered by Google Gemini
- **🔄 LangGraph Workflow** - Orchestrated multi-agent pipeline that processes leads autonomously
- **📊 Smart Dashboard** - Real-time analytics with lead metrics, conversion rates, and AI insights
- **🗺️ AI Journey Builder** - Generates personalized multi-channel follow-up sequences (WhatsApp, Email, SMS, Call)
- **🏠 Property Management** - Full CRUD for properties with smart matching
- **📅 Appointment Scheduling** - Site visit management with reminders
- **📈 Analytics** - Detailed metrics with charts and lead distribution
- **🔐 Authentication** - Supabase Auth with JWT tokens
- **🌙 Dark SaaS UI** - Professional dark theme with responsive design

## 🏗️ Architecture

```
Frontend (Next.js 15)
    ↓
FastAPI Backend
    ↓
LangGraph Workflow
    ↓
Gemini AI (Google)
    ↓
Supabase PostgreSQL
```

### AI Agents

1. **Lead Qualification Agent** - Parses customer inquiries to extract name, budget, location, property type, timeline
2. **Lead Scoring Agent** - Assigns score (0-100) and priority (Hot/Warm/Cold) with explanation
3. **Property Recommendation Agent** - Matches leads with best-fit properties from database
4. **AI Journey Builder Agent** - Creates personalized follow-up sequences across multiple channels

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui, TanStack Query |
| Backend | FastAPI, Python, SQLAlchemy, LangGraph |
| AI | Google Gemini 1.5 Pro |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth + JWT |
| Charts | Recharts |
| Deployment | Vercel (frontend), Railway (backend) |

## 📁 Project Structure

```
proppilot-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # FastAPI route handlers
│   │   ├── core/                # Config, auth, database
│   │   ├── db/repositories/     # Data access layer
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── prompts/             # Gemini AI prompt templates
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── agents/          # Individual AI agents
│   │   │   └── workflows/       # LangGraph orchestration
│   │   └── main.py              # FastAPI entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages & routes
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   ├── dashboard/       # Dashboard-specific
│   │   │   ├── leads/           # Lead management
│   │   │   ├── properties/      # Property management
│   │   │   └── journey/         # Journey builder
│   │   ├── lib/                 # Utilities & API client
│   │   ├── types/               # TypeScript definitions
│   │   └── styles/              # Global CSS
│   ├── Dockerfile
│   └── package.json
├── deployment/
│   ├── docker-compose.yml
│   └── vercel.json
├── docs/
│   └── schema.sql               # Database schema
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16 (or Supabase account)
- Google Gemini API key
- Docker (optional)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and configure
cp .env.example .env
# Edit .env with your credentials

# Run migrations (creates tables)
python -c "import asyncio; from app.core.database.session import init_db; asyncio.run(init_db())"

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env file
cp .env.local.example .env.local
# Edit with your backend URL

# Start dev server
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

## 🤖 AI Workflows

### Lead Processing Pipeline

1. **Lead Created** → Qualification Agent extracts structured data from inquiry
2. **Qualified** → Scoring Agent calculates lead score (0-100) and priority
3. **Scored** → Recommendation Agent finds best property matches
4. **Recommended** → Journey Builder creates personalized follow-up sequence
5. **Journey Active** → Steps execute automatically on schedule

### Journey Rules

- Sequence auto-stops if customer replies, site visit booked, or property booked
- Different channels used for variety (WhatsApp → Email → SMS → Call)
- Intervals adjusted based on lead priority (Hot: shorter, Cold: longer)

## 📊 Dashboard

- Today's Leads count
- Hot/Warm/Cold lead distribution
- Pending follow-up sequences
- Scheduled site visits
- Booking conversion rate
- AI-powered insights
- Lead source analytics
- Recent lead activity feed

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

See `.env.example` for all required environment variables.

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_API_KEY` - Google Gemini API key
- `SECRET_KEY` - JWT signing secret
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## 🤝 Contributing

This is a hackathon MVP. Contributions, issues, and feature requests are welcome!

## 📄 License

MIT
=======
# proppilot.ai
>>>>>>> d042f3aeea70a963bb375b7110af8ba5981c884a
