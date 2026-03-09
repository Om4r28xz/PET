# 🐾 PetCare — Distributed Pet Health Platform

A monorepo containing a **React SPA** frontend and three independent microservices for managing your puppy's nutrition, medical records, and real-time health alerts.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (React SPA)               │
│                    Deployed on Render                  │
└────────┬──────────────┬──────────────┬───────────────┘
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼──────────────┐
    │Nutrition│   │  Medical   │  │   Event Gateway    │
    │ Service │   │  Ledger    │  │ (Supabase Edge Fn) │
    │ Python  │   │ Node.js/TS │  │ Deno / WebSockets  │
    │ FastAPI │   │ Express    │  │                    │
    │ Vercel  │   │ Vercel     │  │ Supabase Realtime  │
    └─────────┘   └────────────┘  └────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- npm ≥ 9

### 1. Install Dependencies

```bash
# Root (installs all npm workspaces)
npm install

# Nutrition service (Python)
cd services/nutrition
pip install -r requirements.txt
cd ../..
```

### 2. Start Services (each in its own terminal)

```bash
# Terminal 1: Nutrition Intelligence (port 8000)
cd services/nutrition
uvicorn main:app --reload --port 8000

# Terminal 2: Medical Ledger (port 3001)
cd services/medical-ledger
npm run dev

# Terminal 3: Event Gateway (port 3002)
cd services/event-gateway
npm run dev

# Terminal 4: Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
PET/
├── frontend/                   # React SPA (Vite)
│   ├── src/
│   │   ├── components/         # Sidebar, Toast, NutritionRing, PulseIcon
│   │   ├── hooks/              # useToast, useEvents
│   │   ├── pages/              # Dashboard, Nutrition, Medical
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css           # Design system
│   │   └── main.jsx
│   └── index.html
├── services/
│   ├── nutrition/              # Service A: Python + FastAPI
│   │   ├── main.py
│   │   ├── api/index.py        # Vercel serverless wrapper
│   │   ├── vercel.json
│   │   └── requirements.txt
│   ├── medical-ledger/         # Service B: Node.js + TypeScript
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── db.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── event-gateway/          # Service C: Supabase Edge Functions
│       ├── src/index.ts        # Local dev server (SSE)
│       ├── supabase/
│       │   ├── functions/
│       │   │   ├── notify/     # Edge Function: event receiver
│       │   │   └── check-schedule/ # Edge Function: cron reminder
│       │   └── config.toml
│       ├── package.json
│       └── tsconfig.json
└── package.json                # Monorepo root (npm workspaces)
```

## Services

| Service | Tech Stack | Port | Description |
|---------|-----------|------|-------------|
| Nutrition Intelligence | Python + FastAPI | 8000 | Calculates BARF/Kibble nutrition (MER formula) |
| Medical Ledger | Node.js + TypeScript | 3001 | CRUD for vaccines, deworming, vet visits |
| Event Gateway | Supabase Edge Functions | 3002 | Real-time events via SSE / Supabase Realtime |

## Deployment

| Component | Platform |
|-----------|----------|
| Frontend SPA | **Render** |
| Nutrition Service | **Vercel** (Serverless Python) |
| Medical Ledger | **Vercel** (Node.js) |
| Event Gateway | **Supabase** (Edge Functions + Realtime) |

## Design System

- **Primary**: Steel Blue `#4682B4`
- **Accent**: Mint Green `#2ECC71` (success states)
- **Typography**: Inter (Google Fonts)
- **Approach**: Mobile-first, minimalist, "every pixel has a purpose"
