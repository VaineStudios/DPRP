# DPRP — Disaster Preparedness & Response Platform

A real-time coordination platform for Jamaica's disaster response ecosystem. Three interconnected Progressive Web Apps for administrators, shelter managers, and residents — powered by AI decision support via **IRIS** (Intelligent Response & Insight System).

Seeded with **915 ODPEM-registered shelters** across Jamaica's 14 parishes.

> **New here?** See the [Getting Started Guide](GETTING-STARTED.md) for a quick overview of all three apps, how to use them, and demo instructions.

---

## Architecture

```
                 Admin Dashboard        Shelter Manager        Resident Finder
                   (React PWA)           (React PWA)            (React PWA)
                       │                      │                      │
                       └──────────┬───────────┘──────────────────────┘
                                  │
                          Express + Socket.io
                            (Node.js API)
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                PostgreSQL    Claude AI     WebSockets
                 (Prisma)    (Anthropic)    (Real-time)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.io, JWT |
| Frontend | React 18, Vite, TypeScript (3 PWAs) |
| AI | Claude API (Anthropic SDK) |
| Maps | Leaflet.js + OpenStreetMap (admin only) |
| Charts | Chart.js (admin only) |
| Deployment | Railway (API + static hosting) |

---

## Features

### Admin Dashboard
- **Interactive Map** — 915 shelter pins color-coded by capacity (green/yellow/orange/red/gray)
- **Real-time Updates** — shelter status changes appear instantly via WebSocket
- **IRIS AI Analysis** — on-demand network analysis with prioritized action directives
- **Preparedness Analytics** — resource gap analysis, vulnerability heatmap, historical comparison, scenario modeling
- **Broadcasts** — send priority messages to all shelters or targeted parishes
- **Disaster Lifecycle** — manage events through PREPARING → ACTIVE → RECOVERY → CLOSED

### Shelter Manager
- **Resource Reporting** — tap-based UI for capacity, water, food, and medical levels (1-5 scale)
- **Offline Queue** — submissions stored locally and auto-synced when reconnected
- **Broadcast Alerts** — receive admin messages with priority-based styling
- **Connection Status** — visual indicator with last sync time

### Resident Finder
- **GPS Auto-locate** — prompts for location on load
- **Nearest Shelters** — ranked by distance + available capacity (top 5)
- **No Auth Required** — public access, lightweight (~150KB)

### IRIS — AI Decision Support
- **Real-time Analysis** — analyzes live shelter data during active disasters, returns 3-5 prioritized directives (redirect, resupply, dispatch, consolidate, evacuate)
- **Preparedness Predictions** — capacity forecasts, supply pre-positioning, response timeline milestones based on historical patterns
- **Scenario Modeling** — ad-hoc "what-if" analysis for custom disaster parameters (category, wind speed, parishes)

### Real-time (Socket.io)
- `shelter:updated` — new resource update → admin dashboard
- `ai:recommendation` — IRIS analysis result → admin panel
- `broadcast:message` — admin broadcast → shelter managers (all or by parish)

### PWA / Offline
- Service workers with Workbox caching on all 3 apps
- Map tiles cached for 7 days (admin)
- API responses cached NetworkFirst with 1-hour TTL
- Installable on mobile devices

---

## Database Models

| Model | Purpose |
|-------|---------|
| **User** | Admin and shelter manager accounts (JWT + bcrypt) |
| **Shelter** | 915 ODPEM shelters with location, capacity, status |
| **DisasterEvent** | Hurricane/emergency lifecycle tracking |
| **ShelterUpdate** | Real-time resource levels from shelter managers |
| **AiRecommendation** | Stored IRIS analysis and predictions |
| **Broadcast** | Admin messages with parish targeting and priority |

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Create user |
| POST | `/api/auth/login` | — | Get JWT token |
| GET | `/api/shelters` | Yes | List shelters (filter by parish) |
| GET | `/api/shelters/:id` | Yes | Shelter detail + update history |
| POST | `/api/updates` | Shelter | Submit resource levels |
| GET | `/api/updates/:shelterId` | Yes | Update history |
| GET | `/api/disasters` | Admin | List disaster events |
| POST | `/api/disasters` | Admin | Create event |
| PATCH | `/api/disasters/:id` | Admin | Update event status |
| GET | `/api/disasters/:id/stats` | Admin | Aggregated metrics |
| GET | `/api/disasters/:id/timeline` | Admin | Hourly resource trends |
| POST | `/api/ai/analyze` | Admin | IRIS real-time analysis |
| POST | `/api/ai/predict` | Admin | IRIS preparedness forecast |
| GET | `/api/ai/recommendations` | Admin | Stored recommendations |
| POST | `/api/broadcasts` | Admin | Send broadcast message |
| GET | `/api/broadcasts` | Admin | Recent broadcasts |
| GET | `/api/recommend?lat=&lng=` | Public | Nearest shelters for residents |
| GET | `/api/health` | — | Health check |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Setup

```bash
# Clone
git clone https://github.com/VaineStudios/DPRP.git
cd DPRP

# Install all dependencies
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your database URL, JWT secret, and Anthropic API key

# Run migrations and seed 915 shelters
npm run db:migrate
npm run seed

# Start all apps (server + 3 clients)
npm run dev
```

### Dev URLs
| App | URL |
|-----|-----|
| Admin Dashboard | http://localhost:5174 |
| Shelter Manager | http://localhost:5173 |
| Resident Finder | http://localhost:5175 |
| API Server | http://localhost:3000 |

### Default Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dprp.gov.jm | admin123 |
| Shelter Manager | shelter@dprp.gov.jm | shelter123 |

---

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dprp
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
SHELTER_OFFLINE_THRESHOLD_MINUTES=30
AI_CACHE_TTL_MINUTES=5
```

---

## Deployment (Railway)

The platform deploys as a single Railway service — the Express server serves all 3 client PWAs as static files.

1. Create a Railway project with PostgreSQL
2. Connect the GitHub repo, set root directory to `server/`
3. Set environment variables (Railway auto-links `DATABASE_URL`)
4. Add `RAILWAY_TOKEN` to GitHub secrets for CI/CD

The GitHub Actions workflow builds all clients, bundles them into `server/public/`, and deploys via Railway CLI.

| Path | App |
|------|-----|
| `/` | Admin Dashboard |
| `/shelter/` | Shelter Manager |
| `/resident/` | Resident Finder |
| `/api/*` | REST API |
| `/socket.io/` | WebSocket |

---

## Project Structure

```
dprp/
├── server/
│   ├── src/
│   │   ├── index.ts              # Express + Socket.io entry
│   │   ├── routes/               # API route handlers
│   │   ├── services/             # AI, Socket.io, geolocation
│   │   ├── middleware/           # JWT auth, role authorization
│   │   └── types/               # TypeScript interfaces
│   └── prisma/
│       ├── schema.prisma         # Database schema
│       ├── migrations/           # SQL migrations
│       └── seed/                 # 915 shelters + demo data
├── client-admin/                 # Admin dashboard PWA
│   └── src/
│       ├── pages/                # Dashboard, Preparedness, Login
│       ├── components/           # Map, IRIS panels, charts, broadcasts
│       └── api/                  # API client, Socket.io client
├── client-shelter/               # Shelter manager PWA
│   └── src/
│       ├── pages/                # UpdateForm, Login
│       ├── components/           # BroadcastAlert, StatusBar
│       └── api/                  # API client, Socket.io client
├── client-resident/              # Resident finder PWA
│   └── src/
│       └── pages/                # GPS locate + shelter list
└── .github/workflows/
    └── deploy.yml                # Railway CI/CD pipeline
```

---

## Scripts

```bash
npm run dev              # Run all 4 apps concurrently
npm run dev:server       # Server only
npm run dev:admin        # Admin dashboard only
npm run dev:shelter      # Shelter manager only
npm run dev:resident     # Resident finder only
npm run build            # Build everything
npm run seed             # Seed database (915 shelters + demo data)
npm run db:migrate       # Run Prisma migrations
npm run db:studio        # Open Prisma Studio
```

---

## License

Built for the Jamaica Hackathon 2026.
