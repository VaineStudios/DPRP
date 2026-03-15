# DPRP — Disaster Preparedness & Response Platform

## Implementation Plan v2.0

**Team:** Hackathon Build Team
**App Name:** DPRP (Disaster Preparedness Response Platform)
**Build Window:** 12–24 hours
**Date:** March 2026

---

## 1. Project overview

A real-time coordination platform for Jamaica's disaster response ecosystem. Three PWA interfaces — admin dashboard, shelter manager, and resident finder — connected by a Node.js backend with Socket.io for live updates, PostgreSQL for persistence, and Claude AI for decision support and preparedness predictions.

**Seeded with real data:** 915 ODPEM-registered shelters across all 14 parishes.

---

## 2. Tech stack

| Layer            | Technology                        | Justification                              |
|------------------|-----------------------------------|--------------------------------------------|
| Backend API      | Node.js + Express                 | Team strength, fast iteration               |
| Real-time        | Socket.io                         | Built-in reconnection, auto-fallback to HTTP long-polling on poor connections |
| Database         | PostgreSQL (AWS RDS)              | Relational integrity, JSON support          |
| ORM              | Prisma                            | Type-safe queries, easy migrations          |
| Auth             | JWT (jsonwebtoken + bcrypt)       | Stateless, no session store needed          |
| AI               | Claude API (Anthropic)            | Decision support + preparedness predictions |
| Frontend (x3)    | React + Vite                      | Fast builds, PWA plugin available           |
| Maps             | Leaflet.js + OpenStreetMap tiles  | 42KB gzipped (vs 200KB+ Google Maps), tiles cacheable by service worker for offline use, no API key billing, loads without internet after first cache |
| Deployment       | AWS EC2 (API) + S3/CloudFront or EC2 static (PWAs) | All-AWS, cloud-native |
| CI/CD            | GitHub Actions                    | Automated deploy on push                    |

---

## 3. Design constraints

### 3a. Low bandwidth prioritization

This platform must function in hurricane conditions: degraded cell towers, congested networks, intermittent connectivity. Every design decision is filtered through this constraint.

| Constraint                    | Target                                  | How                                              |
|-------------------------------|----------------------------------------|--------------------------------------------------|
| Initial page load (shelter)   | < 100KB transferred                    | Minimal dependencies, no heavy UI framework, inline critical CSS |
| Initial page load (resident)  | < 150KB transferred                    | No map library (list-only UI), system fonts       |
| Initial page load (admin)     | < 400KB transferred                    | Leaflet (42KB) + tiles lazy-loaded                |
| Time to interactive (shelter) | < 2s on 3G                             | Code splitting, preload critical path             |
| Time to interactive (resident)| < 3s on 3G                             | Auto-fires GPS on load, no user interaction needed|
| API payload size              | < 5KB per response                     | Paginate shelter lists, send only changed fields  |
| Real-time transport           | Auto-fallback                          | Socket.io downgrades: WebSocket → HTTP long-polling → polling |
| Image assets                  | Zero                                   | No images in shelter or resident app. Icons are SVG or CSS only |
| Fonts                         | System font stack only                 | `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| Offline capability            | Full submit (shelter), read-only cache (resident, admin) | Service workers cache app shell + last known data |
| Map tiles                     | Cached after first load                | Service worker caches OpenStreetMap tiles; offline map degrades gracefully |
| Shelter update payload        | < 500 bytes                            | 4 integers (1-5) + optional short text            |

### 3b. Mobile-first requirements

| App              | Primary device  | Design approach                                    |
|------------------|-----------------|----------------------------------------------------|
| Shelter manager  | Mobile phone    | **Mobile-first (hard requirement).** Single-column layout. Touch targets minimum 48x48px. No hover interactions. Thumb-reachable submit button. Viewport meta tag. No horizontal scroll. Tested at 320px width minimum. |
| Resident finder  | Mobile phone    | **Mobile-first (hard requirement).** Single-column card stack. Large readable text (16px+ base). GPS prompt is the first and only interaction. Cards sized for one-hand scanning. |
| Admin dashboard  | Desktop/tablet  | **Desktop-primary, tablet-responsive.** Map fills viewport. Side panel collapses to bottom sheet on tablet. Not optimized for phone — admins use laptops in EOCs. |

### 3c. Accessibility baseline
- All interactive elements keyboard accessible
- Color is never the only indicator (icons + color on pins)
- Minimum contrast ratio 4.5:1
- Screen reader labels on icon selectors
- Focus indicators visible

---

## 4. Priority tiers

Features are classified into three tiers. **Build in order. Do not start a lower tier until the tier above is complete and stable.**

### P0 — Must ship (demo fails without these)

| #    | Feature                                      | Component        | Est. hours |
|------|----------------------------------------------|------------------|------------|
| P0-1 | Project scaffold (monorepo, Prisma, Express) | Backend          | 1.0        |
| P0-2 | Database schema + migrations                 | Backend          | 0.5        |
| P0-3 | Seed script (parse ODPEM xlsx → shelters)    | Backend          | 1.0        |
| P0-4 | JWT auth (login, register, middleware)        | Backend          | 1.0        |
| P0-5 | Shelter CRUD API endpoints                   | Backend          | 0.5        |
| P0-6 | Shelter update submission endpoint           | Backend          | 0.5        |
| P0-7 | Socket.io integration (emit on new update)   | Backend          | 1.0        |
| P0-8 | Shelter manager PWA — icon-tap update UI     | Frontend         | 2.5        |
| P0-9 | Admin dashboard — map with color-coded pins  | Frontend         | 3.0        |
| P0-10| Admin dashboard — hover cards on pins        | Frontend         | 1.0        |
| P0-11| Admin dashboard — live Socket.io updates     | Frontend         | 1.0        |
| P0-12| Resident finder PWA — auto-locate + recommend| Frontend        | 2.0        |
| P0-13| AI decision support endpoint                 | Backend/AI       | 2.0        |
| P0-14| Admin dashboard — AI recommendations panel   | Frontend         | 1.5        |
| P0-15| PWA service workers (all 3 apps)             | Frontend         | 1.5        |
|      |                                              | **P0 subtotal:** | **20.0**   |

### P1 — Should ship (significantly strengthens demo)

| #    | Feature                                       | Component       | Est. hours |
|------|-----------------------------------------------|-----------------|------------|
| P1-1 | AI preparedness predictions endpoint          | Backend/AI      | 2.0        |
| P1-2 | Admin dashboard — preparedness predictions UI | Frontend        | 1.5        |
| P1-3 | Disaster event management (create/activate)   | Backend + Admin | 1.5        |
| P1-4 | Seed historical disaster events + updates     | Backend         | 1.0        |
| P1-5 | Shelter manager — offline queue (submit when reconnected) | Frontend | 1.5  |
| P1-6 | Admin dashboard — offline shelter detection (gray pins, last seen) | Frontend | 1.0 |
| P1-7 | Docker containerization                       | DevOps          | 1.0        |
| P1-8 | AWS deployment (EC2 + RDS)                    | DevOps          | 2.0        |
| P1-9 | GitHub Actions CI/CD pipeline                 | DevOps          | 1.0        |
|      |                                               | **P1 subtotal:**| **12.5**   |

### P2 — Nice to have (polish and bonus points)

| #    | Feature                                       | Component       | Est. hours |
|------|-----------------------------------------------|-----------------|------------|
| P2-1 | Shelter geocoding (Google Maps batch API)     | Backend         | 1.0        |
| P2-2 | Admin dashboard — filter by parish/status     | Frontend        | 1.0        |
| P2-3 | Admin dashboard — shelter update timeline     | Frontend        | 1.0        |
| P2-4 | Resident finder — directions link (Google Maps)| Frontend       | 0.5        |
| P2-5 | Audit log table + admin viewer                | Backend + Admin | 1.5        |
| P2-6 | Rate limiting on public endpoints             | Backend         | 0.5        |
| P2-7 | Notification sound/toast on new shelter update| Frontend        | 0.5        |
| P2-8 | Admin — acknowledge/dismiss AI recommendations| Frontend       | 1.0        |
| P2-9 | Loading states, error boundaries, empty states| Frontend        | 1.0        |
| P2-10| HTTPS/SSL via Let's Encrypt or AWS ACM        | DevOps         | 1.0        |
|      |                                               | **P2 subtotal:**| **9.0**    |

**Total estimated: 41.5 hours across all tiers. P0 alone is 20 hours — the critical path.**

---

## 5. Project structure

```
dprp/
├── README.md
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── server/                          # Node.js backend
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed/
│   │       ├── seed.js              # Main seed orchestrator
│   │       ├── shelters.js          # Parse ODPEM xlsx → shelters
│   │       ├── users.js             # Default admin + shelter manager accounts
│   │       └── disasters.js         # Historical events + simulated updates
│   ├── src/
│   │   ├── index.js                 # Express + Socket.io bootstrap
│   │   ├── config/
│   │   │   └── index.js             # Env vars, constants
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification
│   │   │   └── validate.js          # Request validation
│   │   ├── routes/
│   │   │   ├── auth.js              # POST /api/auth/login, /register
│   │   │   ├── shelters.js          # GET/POST /api/shelters, /api/shelters/:id
│   │   │   ├── updates.js           # POST /api/updates, GET /api/updates/:shelterId
│   │   │   ├── disasters.js         # CRUD /api/disasters
│   │   │   ├── ai.js                # POST /api/ai/analyze, /api/ai/predict
│   │   │   └── recommend.js         # GET /api/recommend?lat=&lng= (public, no auth)
│   │   ├── services/
│   │   │   ├── ai.js                # Claude API integration
│   │   │   ├── geolocation.js       # Distance calc, shelter ranking
│   │   │   └── socket.js            # Socket.io event handlers
│   │   └── utils/
│   │       ├── jwt.js               # Token sign/verify helpers
│   │       └── errors.js            # Standard error responses
│   └── Dockerfile
│
├── client-admin/                    # Admin dashboard PWA
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   ├── client.js            # Axios instance with JWT
│       │   └── socket.js            # Socket.io client singleton
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useShelters.js
│       │   └── useSocket.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx        # Main map + panels layout
│       │   └── Preparedness.jsx     # AI predictions view
│       └── components/
│           ├── Map.jsx              # Leaflet map with pins
│           ├── ShelterPin.jsx       # Color-coded marker
│           ├── ShelterCard.jsx      # Hover popup card
│           ├── AiPanel.jsx          # Recommendations feed
│           ├── StatusBar.jsx        # Active disaster info
│           └── DisasterSelector.jsx # Switch between events
│
├── client-shelter/                  # Shelter manager PWA
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   ├── client.js
│       │   └── socket.js
│       ├── hooks/
│       │   ├── useAuth.js
│       │   └── useOfflineQueue.js   # Queue updates when offline
│       ├── pages/
│       │   ├── Login.jsx
│       │   └── UpdateForm.jsx       # The icon-tap interface
│       └── components/
│           ├── IconSelector.jsx     # Tap 1-5 icons component
│           ├── SubmitButton.jsx     # Big, obvious, works offline
│           ├── LastUpdate.jsx       # Shows last submitted status
│           └── ConnectionStatus.jsx # Online/offline indicator
│
├── client-resident/                 # Resident finder PWA
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
│           ├── ShelterList.jsx      # Ranked recommendation cards
│           ├── ShelterCard.jsx      # Distance, capacity, resources
│           ├── LoadingState.jsx     # "Finding your location..."
│           └── ErrorState.jsx       # GPS denied / no shelters
│
└── data/
    └── National-Shelter-Listing-2025-2026.xlsx
```

---

## 6. Database schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  SHELTER_MANAGER
}

enum DisasterStatus {
  PREPARING
  ACTIVE
  RECOVERY
  CLOSED
}

enum ShelterStatus {
  OPERATIONAL
  OFFLINE
}

enum UpdateSource {
  WEB
  SMS
}

enum RecommendationType {
  RESPONSE
  PREPAREDNESS
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model User {
  id             String           @id @default(uuid())
  name           String
  email          String           @unique
  passwordHash   String           @map("password_hash")
  role           UserRole
  shelterId      String?          @map("shelter_id")
  shelter        Shelter?         @relation(fields: [shelterId], references: [id])
  updates        ShelterUpdate[]
  acknowledged   AiRecommendation[] @relation("AcknowledgedBy")
  createdAt      DateTime         @default(now()) @map("created_at")

  @@map("users")
}

model Shelter {
  id             String           @id @default(uuid())
  name           String
  parish         String
  location       String?
  areasServed    String?          @map("areas_served")
  facilityType   String?          @map("facility_type")
  lat            Float?
  lng            Float?
  maxCapacity    Int?             @map("max_capacity")
  status         ShelterStatus    @default(OPERATIONAL)
  managers       User[]
  updates        ShelterUpdate[]
  recommendations AiRecommendation[]
  createdAt      DateTime         @default(now()) @map("created_at")

  @@map("shelters")
}

model DisasterEvent {
  id               String            @id @default(uuid())
  name             String
  category         Int?
  windSpeedMph     Float?            @map("wind_speed_mph")
  status           DisasterStatus    @default(PREPARING)
  affectedParishes String[]          @map("affected_parishes")
  landfallDate     DateTime?         @map("landfall_date")
  startDate        DateTime          @map("start_date")
  endDate          DateTime?         @map("end_date")
  notes            String?
  updates          ShelterUpdate[]
  recommendations  AiRecommendation[]
  createdAt        DateTime          @default(now()) @map("created_at")

  @@map("disaster_events")
}

model ShelterUpdate {
  id               String         @id @default(uuid())
  shelterId        String         @map("shelter_id")
  shelter          Shelter        @relation(fields: [shelterId], references: [id])
  disasterEventId  String?        @map("disaster_event_id")
  disasterEvent    DisasterEvent? @relation(fields: [disasterEventId], references: [id])
  reportedById     String?        @map("reported_by")
  reportedBy       User?          @relation(fields: [reportedById], references: [id])
  capacityLevel    Int            @map("capacity_level")
  waterLevel       Int            @map("water_level")
  foodLevel        Int            @map("food_level")
  medicalLevel     Int            @map("medical_level")
  notes            String?
  source           UpdateSource   @default(WEB)
  createdAt        DateTime       @default(now()) @map("created_at")

  @@index([shelterId, createdAt])
  @@index([disasterEventId])
  @@map("shelter_updates")
}

model AiRecommendation {
  id               String              @id @default(uuid())
  disasterEventId  String?             @map("disaster_event_id")
  disasterEvent    DisasterEvent?      @relation(fields: [disasterEventId], references: [id])
  shelterId        String?             @map("shelter_id")
  shelter          Shelter?            @relation(fields: [shelterId], references: [id])
  type             RecommendationType
  priority         Priority
  recommendation   String
  reasoning        String?
  acknowledgedById String?             @map("acknowledged_by")
  acknowledgedBy   User?               @relation("AcknowledgedBy", fields: [acknowledgedById], references: [id])
  acknowledgedAt   DateTime?           @map("acknowledged_at")
  createdAt        DateTime            @default(now()) @map("created_at")

  @@index([disasterEventId, type])
  @@map("ai_recommendations")
}
```

---

## 7. API endpoints

### Auth (public)
| Method | Path                | Body                              | Returns          |
|--------|---------------------|-----------------------------------|------------------|
| POST   | /api/auth/register  | { name, email, password, role }   | { token, user }  |
| POST   | /api/auth/login     | { email, password }               | { token, user }  |

### Shelters (authenticated)
| Method | Path                    | Auth     | Returns                      |
|--------|-------------------------|----------|------------------------------|
| GET    | /api/shelters           | Any      | All shelters with latest update |
| GET    | /api/shelters/:id       | Any      | Shelter detail + update history |

### Shelter updates (authenticated)
| Method | Path                    | Auth             | Body / Returns                        |
|--------|-------------------------|------------------|---------------------------------------|
| POST   | /api/updates            | SHELTER_MANAGER  | { shelterId, capacityLevel, waterLevel, foodLevel, medicalLevel, notes } → emits socket event |
| GET    | /api/updates/:shelterId | Any              | Update history for a shelter           |

### Disaster events (admin)
| Method | Path                     | Auth   | Body / Returns                        |
|--------|--------------------------|--------|---------------------------------------|
| GET    | /api/disasters           | ADMIN  | All events                            |
| POST   | /api/disasters           | ADMIN  | Create new event                      |
| PATCH  | /api/disasters/:id       | ADMIN  | Update status (activate, close, etc.) |
| GET    | /api/disasters/:id/stats | ADMIN  | Summary stats for an event            |

### AI (admin)
| Method | Path                 | Auth   | Returns                                             |
|--------|----------------------|--------|-----------------------------------------------------|
| POST   | /api/ai/analyze      | ADMIN  | Real-time recommendations for active disaster       |
| POST   | /api/ai/predict      | ADMIN  | Preparedness predictions based on historical data   |
| GET    | /api/ai/recommendations?eventId= | ADMIN | Stored recommendations for an event     |

### Resident recommendation (public — no auth)
| Method | Path                           | Auth | Returns                           |
|--------|--------------------------------|------|-----------------------------------|
| GET    | /api/recommend?lat=&lng=       | None | Top 5 nearest shelters ranked by distance + capacity |

---

## 8. Socket.io events

### Server → Client (admin dashboard listens)
| Event                  | Payload                                         | Trigger                          |
|------------------------|-------------------------------------------------|----------------------------------|
| shelter:updated        | { shelterId, update, shelter }                  | New shelter update submitted     |
| shelter:status-changed | { shelterId, status, lastSeen }                 | Shelter goes offline/online      |
| ai:recommendation      | { recommendation }                              | New AI recommendation generated  |
| disaster:status-changed| { disasterEventId, status }                     | Disaster event status changes    |

### Client → Server
| Event                  | Payload                                         | From                             |
|------------------------|-------------------------------------------------|----------------------------------|
| join:admin             | { token }                                       | Admin dashboard on connect       |
| join:shelter           | { token, shelterId }                            | Shelter manager on connect       |

---

## 9. AI integration detail

### 9a. Response analysis (POST /api/ai/analyze)

**When:** Admin clicks "Analyze" during an active disaster event.

**Input to Claude:** Current snapshot of all shelters with their latest update, grouped by parish.

**System prompt structure:**
```
You are a disaster response coordinator for Jamaica's ODPEM.
You are analyzing shelter data during {disaster.name} (Category {disaster.category}).

Current shelter network status:
{shelterDataAsStructuredText}

Based on this data, provide your top 3-5 prioritized recommendations.
For each recommendation, specify:
- target_shelter_id (if applicable)
- type: "redirect" | "resupply" | "dispatch_team" | "consolidate" | "evacuate"
- priority: "critical" | "high" | "medium" | "low"
- recommendation: one-sentence action item
- reasoning: 2-3 sentences explaining why

Return as JSON array.
```

### 9b. Preparedness predictions (POST /api/ai/predict)

**When:** Admin requests predictions for a new/approaching disaster event.

**Input to Claude:** Historical disaster events with their full update timelines, plus the approaching event's characteristics.

**System prompt structure:**
```
You are a disaster preparedness analyst for Jamaica's ODPEM.
An approaching weather event has these characteristics:
- Name: {event.name}
- Projected category: {event.category}
- Projected wind speed: {event.windSpeedMph} mph
- Projected affected parishes: {event.affectedParishes}

Historical data from previous events:
{historicalEventsWithUpdateTimelines}

Based on historical patterns, predict:
1. Which shelters in the affected parishes are likely to reach capacity first?
2. Which resource types (water, food, medical) will be depleted soonest?
3. Recommended pre-positioning of supplies (which shelters, what resources, how much)
4. Estimated timeline for shelter capacity saturation

Return as JSON with fields: predictions[], prePositioning[], timeline.
```

---

## 10. Seed data plan

### 10a. Shelters (from ODPEM xlsx)
- Parse all 915 shelters from the National Shelter Listing
- Normalize parish names (e.g., "Hanover " → "Hanover", "St James" → "St. James")
- Normalize facility types (e.g., "Government School " → "Government School")
- Assign approximate lat/lng per parish centroid (P0) or geocode addresses (P2)
- Set all shelters to OPERATIONAL status initially

### 10b. Users
- 1 admin account: admin@dprp.gov.jm / admin123
- 5 shelter manager accounts, each assigned to a different parish shelter
- These are demo accounts for the hackathon presentation

### 10c. Historical disaster events (for AI predictions)
Seed 2 past events with realistic update timelines:

**Event 1: "Hurricane Melissa" (Category 3)**
- Affected: St. Thomas, Portland, St. Mary, Kingston & St. Andrew
- Duration: 72 hours
- Seed 50-80 shelter_updates across affected shelters showing:
  - Capacity rising from level 1 → 4-5 over 12 hours
  - Water dropping from 5 → 1-2 over 18 hours
  - Food dropping from 5 → 2-3 over 24 hours
  - Medical staying relatively stable (3-4)

**Event 2: "Tropical Storm Nicole" (Category 1)**
- Affected: Westmoreland, St. James, Hanover, Trelawny
- Duration: 48 hours
- Seed 30-50 shelter_updates showing milder impact:
  - Capacity rising to level 2-3
  - Resources dropping to level 3-4

This gives the AI two different intensity profiles to reason from.

---

## 11. PWA specifications

### 11a. Admin dashboard
- **Login required** (ADMIN role)
- **Desktop-primary, tablet-responsive**
- **Main view:** Full-screen Leaflet map with parish boundaries
- **Pin colors:**
  - Green (#22c55e) — Operational, capacity level 1-2 (plenty of room)
  - Amber (#f59e0b) — Operational, capacity level 3 (moderate)
  - Red (#ef4444) — Operational, capacity level 4-5 (at/near capacity)
  - Gray (#6b7280) — Offline (no update in 30+ minutes)
- **Pin icons:** Each pin includes a small capacity icon glyph (not color-only) so color is never the sole indicator
- **Hover card on pin:** Shelter name, facility type, capacity/water/food/medical icons, last update timestamp, "last seen X min ago" for offline
- **Right panel:** AI recommendations feed, sortable by priority
- **Top bar:** Active disaster event name + status, analyze button
- **Preparedness view:** Separate page/tab for prediction results

### 11b. Shelter manager (MOBILE-FIRST)
- **Login required** (SHELTER_MANAGER role)
- **Mobile-first — designed for one-handed phone use in a shelter**
- **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1">` required
- **Min supported width:** 320px
- **Touch targets:** All tappable elements minimum 48x48px with 8px gap between targets
- **Single-column layout, no horizontal scroll**
- **Single-screen UI optimized for speed:**
  - Shelter name header (auto-assigned from their account)
  - 4 rows of icon selectors:
    - Capacity: 5 person icons (tap to set level 1-5)
    - Water: 5 water drop icons
    - Food: 5 food box icons
    - Medical: 5 medical cross icons
  - Optional notes text field
  - Large "Send update" button — full-width, minimum 56px height, thumb-reachable at bottom of screen
- **Connection status indicator** (green dot = online, red = offline) — top of screen, always visible
- **Offline queue:** Updates saved to IndexedDB, auto-submitted on reconnect
- **Last update confirmation** shown after successful submit
- **No hover interactions** — everything is tap/click
- **No images loaded** — all icons are inline SVG or CSS shapes

### 11c. Resident finder (MOBILE-FIRST)
- **No login required** — fully public
- **Mobile-first — designed for someone in rain looking at a phone**
- **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1">` required
- **Min supported width:** 320px
- **No images, no map, no heavy assets** — cards only for maximum speed
- **Zero interaction flow:**
  1. Page loads → shows "Finding your location..." with spinner
  2. GPS fires automatically via navigator.geolocation
  3. API call to /api/recommend?lat=X&lng=Y
  4. Renders top 5 shelter cards ranked by proximity + capacity
- **Shelter card shows:** Name, parish, distance (km), capacity indicator (color + icon), facility type
- **Fallback:** If GPS denied, show simple parish dropdown
- **Offline:** Service worker caches last known recommendations
- **Text size:** 16px minimum base, shelter names 18px+, distance large and bold
- **No horizontal scroll, single column, full-width cards**

---

## 12. Build phases with acceptance criteria

Each action item has a verifiable acceptance criterion. An item is not complete until its criterion passes.

---

### Phase 1: Foundation (hours 0–3) — P0-1 through P0-4

**Goal:** Backend scaffold with database, auth, and seeded shelter data.

| #  | Action item                                       | Acceptance criteria                                                                                           |
|----|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1  | Initialize monorepo with server/ directory        | `npm install` succeeds in server/. Express app starts on PORT with "DPRP API running" console log.             |
| 2  | Configure Prisma with PostgreSQL                  | `npx prisma generate` succeeds. DATABASE_URL reads from .env.                                                  |
| 3  | Define Prisma schema (all 5 models)               | `npx prisma migrate dev` runs without errors. All tables created in PostgreSQL. Verify with `\dt` in psql.     |
| 4  | Build shelter seed script (parse ODPEM xlsx)      | `node prisma/seed/shelters.js` completes. `SELECT COUNT(*) FROM shelters` returns 915. Parish names normalized (no trailing spaces, consistent "St." prefix). |
| 5  | Build user seed script                            | `node prisma/seed/users.js` completes. Admin account and 5 shelter manager accounts exist. Passwords are hashed (not plaintext in DB). |
| 6  | Implement POST /api/auth/register                 | `curl -X POST /api/auth/register -d '{"name":"Test","email":"test@test.com","password":"pass123","role":"ADMIN"}'` returns 201 with `{ token, user }`. Token is valid JWT. Duplicate email returns 409. |
| 7  | Implement POST /api/auth/login                    | `curl -X POST /api/auth/login -d '{"email":"admin@dprp.gov.jm","password":"admin123"}'` returns 200 with `{ token, user }`. Wrong password returns 401. |
| 8  | Implement auth middleware                         | Request to any protected route without Authorization header returns 401. Valid `Bearer <token>` header passes through and attaches `req.user`. Expired token returns 401. |

**Phase 1 exit gate:** Run this sequence without errors:
1. Start server → connects to DB
2. Seed shelters → 915 rows
3. Seed users → 6 accounts
4. Login as admin → receive JWT
5. Use JWT to call GET /api/shelters → returns shelter array

---

### Phase 2: Real-time core (hours 3–5) — P0-5 through P0-7

**Goal:** Shelter CRUD, update submission, and real-time Socket.io events.

| #  | Action item                                       | Acceptance criteria                                                                                           |
|----|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1  | GET /api/shelters — list all with latest update   | Returns array of shelters. Each shelter includes `latestUpdate` object (or null if no updates). Response payload < 200KB for full list. Authenticated requests only (401 without token). |
| 2  | GET /api/shelters/:id — single shelter detail     | Returns shelter with full update history (last 50 updates). 404 for invalid ID.                                |
| 3  | POST /api/updates — submit shelter update         | Accepts `{ shelterId, capacityLevel, waterLevel, foodLevel, medicalLevel, notes }`. All levels validated as integers 1-5 (returns 400 if invalid). Creates ShelterUpdate row in DB. Only SHELTER_MANAGER role can submit (403 for ADMIN). |
| 4  | Integrate Socket.io with Express server           | Socket.io attaches to Express HTTP server. Client can connect at `ws://localhost:PORT`. Connection logged to console. |
| 5  | Emit socket event on new update                   | When POST /api/updates succeeds, server emits `shelter:updated` event to all connected clients in the `admin` room. Event payload includes `{ shelterId, update, shelter }`. |
| 6  | Socket.io room management                         | Clients joining `admin` room receive `shelter:updated` events. Clients not in `admin` room do not receive events. Token validated on socket connection (disconnect on invalid token). |
| 7  | GET /api/recommend?lat=&lng= — public endpoint   | No auth required. Accepts lat/lng query params. Returns top 5 shelters sorted by distance. Each result includes `distanceKm` (calculated via Haversine formula). Returns 400 if lat/lng missing or out of Jamaica bounds. Response < 5KB. |

**Phase 2 exit gate:** Open two terminal windows:
1. Terminal A: Connect to Socket.io as admin
2. Terminal B: `curl -X POST /api/updates` with valid shelter manager JWT
3. Terminal A receives `shelter:updated` event within 1 second
4. `curl /api/recommend?lat=18.47&lng=-77.89` returns 5 shelters with distances

---

### Phase 3: Shelter manager PWA (hours 5–8) — P0-8

**Goal:** Mobile-first PWA where shelter managers submit status updates via icon tapping.

| #  | Action item                                       | Acceptance criteria                                                                                           |
|----|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1  | Scaffold Vite + React project with PWA plugin     | `npm run dev` starts dev server. `npm run build` produces production bundle < 100KB gzipped (excluding source maps). manifest.json present with app name "DPRP Shelter". |
| 2  | Login page                                        | Email + password form. Submits to /api/auth/login. Stores JWT in localStorage. Redirects to update form on success. Shows error message on 401. Mobile-friendly: inputs full-width, 16px font (prevents iOS zoom). |
| 3  | IconSelector component                            | Renders a row of 5 tappable SVG icons. Tapping icon N fills icons 1 through N (like a rating). Each icon touch target is minimum 48x48px. Current level readable by screen reader (`aria-label="Capacity level 3 of 5"`). Works identically on touch and mouse. |
| 4  | UpdateForm page — full icon-tap interface         | Shows shelter name (from logged-in user's assigned shelter). 4 IconSelector rows: capacity, water, food, medical. Optional notes textarea. All 4 selectors default to no selection (user must explicitly set). Submit button disabled until all 4 levels are set. |
| 5  | Submit flow                                       | Tapping "Send update" calls POST /api/updates with JWT. On success: shows green confirmation with timestamp, resets form. On network error: shows "Update queued" message (P1-5 will implement actual queue). Button shows loading spinner during request. Button disabled during request to prevent double-submit. |
| 6  | ConnectionStatus indicator                        | Shows green dot + "Online" or red dot + "Offline" based on navigator.onLine. Updates in real-time when connectivity changes. Positioned at top of screen, always visible, does not scroll away. |
| 7  | Mobile layout verification                        | Entire UI renders within viewport at 320px width with no horizontal scrollbar. Submit button is full-width and reachable by thumb (bottom 25% of screen). No text smaller than 14px. All tap targets 48x48px minimum. Tested in Chrome DevTools mobile emulation (iPhone SE, Galaxy S8). |
| 8  | Register service worker                           | Service worker registered on app load. App shell cached on first visit. Second visit loads from cache (verifiable: disable network in DevTools, app still loads to login screen). |

**Phase 3 exit gate:**
1. Open shelter manager app on phone (or Chrome mobile emulation at 375px)
2. Log in with shelter manager credentials
3. Tap capacity 4, water 1, food 3, medical 4
4. Tap "Send update"
5. See green confirmation
6. Total time from opening form to confirmation: < 10 seconds
7. Disable network → refresh → app shell loads from cache

---

### Phase 4: Admin dashboard (hours 8–13) — P0-9 through P0-11

**Goal:** Desktop-primary dashboard with live-updating map of all 915 shelters.

| #  | Action item                                       | Acceptance criteria                                                                                           |
|----|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1  | Scaffold Vite + React project with PWA plugin     | `npm run build` produces production bundle < 400KB gzipped (Leaflet is ~42KB of this). manifest.json present with app name "DPRP Admin". |
| 2  | Login page                                        | Same pattern as shelter manager login. Rejects non-ADMIN role users with clear error message.                  |
| 3  | Leaflet map — full viewport render                | Map renders filling full viewport below top bar. Centered on Jamaica (lat 18.1, lng -77.3, zoom 9). OpenStreetMap tiles load. Map is pannable and zoomable. |
| 4  | Render all 915 shelters as pins                   | All shelters from GET /api/shelters rendered as circle markers on map. Shelters without lat/lng plotted at parish centroid. No pins missing (count visible markers matches API response count). Map does not freeze or lag with 915 markers (verify < 2s render time). |
| 5  | Color-code pins by capacity level                 | Pins use correct color: green (level 1-2), amber (level 3), red (level 4-5), gray (no updates / offline). Each pin includes a small shape indicator alongside color (not color-only). Shelters with no updates yet show as gray. |
| 6  | Hover/click card on pin                           | Clicking a pin shows popup card with: shelter name, parish, facility type, capacity/water/food/medical levels as icon rows matching shelter manager UI, last update timestamp, "No updates yet" if never updated. Card dismissible by clicking elsewhere. On mobile/tablet: triggered by tap instead of hover. |
| 7  | Socket.io real-time pin updates                   | Connect to Socket.io on dashboard load, join `admin` room. When `shelter:updated` event received: update the affected pin's color without full page reload. Verify: submit update from shelter manager app → admin dashboard pin changes color within 2 seconds. |
| 8  | Top status bar                                    | Shows: active disaster event name + status (or "No active event"), total shelter count, count by status (operational/offline/critical). Updates in real-time as socket events arrive. |
| 9  | Register service worker                           | App shell cached. Map tile caching configured (cache first 3 zoom levels of Jamaica tiles on first load). Offline: app loads with cached tiles and last-known shelter data. |

**Phase 4 exit gate:**
1. Open admin dashboard on desktop browser
2. Log in as admin
3. Map shows 915 shelter pins across Jamaica
4. Open shelter manager on phone, submit update (capacity 5, water 1)
5. Within 2 seconds, the corresponding pin on admin dashboard changes to red
6. Click the pin — hover card shows capacity 5, water 1, timestamp of just now
7. Disable network → refresh admin dashboard → map loads from cache with last-known pin states

---

### Phase 5: Resident finder PWA (hours 13–15) — P0-12

**Goal:** Zero-interaction mobile PWA that auto-locates and recommends shelters.

| #  | Action item                                       | Acceptance criteria                                                                                           |
|----|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1  | Scaffold Vite + React project with PWA plugin     | `npm run build` produces production bundle < 80KB gzipped. No map library. No images. manifest.json present with app name "DPRP Find Shelter". System font stack only. |
| 2  | Auto-geolocation on page load                     | navigator.geolocation.getCurrentPosition fires immediately on mount (no user action required besides GPS permission). Shows "Finding your location..." with spinner while waiting. GPS timeout set to 10 seconds. |
| 3  | API call on GPS success                           | On GPS success, immediately calls GET /api/recommend?lat=X&lng=Y. No user interaction between GPS result and API call. Shows "Finding nearby shelters..." during API request. |
| 4  | Shelter recommendation cards                      | Renders top 5 results as full-width cards in a single column. Each card shows: shelter name (18px bold), parish, distance ("2.3 km away"), capacity indicator (color + icon + text label like "Space available" / "Filling up" / "Nearly full"), facility type. Cards ordered by API ranking (nearest + most available first). |
| 5  | GPS denial fallback                               | If user denies GPS permission or GPS times out: show parish dropdown selector. On parish select, call /api/recommend with parish centroid coordinates. Dropdown lists all 14 parishes alphabetically. |
| 6  | Error states                                      | No shelters found: "No shelters reporting near you. Try selecting your parish below." API failure: "Unable to reach shelter data. Showing last known information." with cached data if available. Network offline on load: show cached recommendations from last visit. |
| 7  | Mobile layout verification                        | No horizontal scroll at 320px width. All text 16px+. Cards have generous vertical padding (16px). Shelter name is largest text on each card. Distance is bold and immediately visible. Total content above fold on 375px screen shows at least top 2 shelters. |
| 8  | Service worker + offline cache                    | App shell cached on first visit. Last API response cached in service worker. On repeat visit with no network: shows cached shelter cards with "Last updated X minutes ago" banner at top. |
| 9  | Performance verification                          | Lighthouse mobile score > 90 for performance. First Contentful Paint < 1.5s on simulated 3G. Time from GPS result to rendered cards < 1s on 4G. Total bundle transferred < 150KB including HTML. |

**Phase 5 exit gate:**
1. Open resident finder on phone (or mobile emulation at 375px)
2. Accept GPS prompt
3. Within 3 seconds: see 5 shelter cards with distance and capacity
4. No buttons pressed, no forms filled
5. Kill network → refresh → see cached results with "last updated" banner
6. Run Lighthouse → performance > 90

---

### Phase 6: AI integration (hours 15–19) — P0-13, P0-14, P1-1, P1-2

**Goal:** Claude-powered decision support and preparedness predictions.

| #  | Action item                                       | Acceptance criteria                                                                                           |
|----|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1  | Claude API service module                         | `server/src/services/ai.js` exports `analyzeNetwork(disasterEvent, shelterData)` and `predictPreparedness(approachingEvent, historicalData)`. Both return parsed JSON. API errors caught and return structured error (not raw Anthropic error). Timeout set to 30 seconds. |
| 2  | POST /api/ai/analyze endpoint                     | Accepts `{ disasterEventId }`. Fetches active event + all shelters with latest updates. Calls Claude with response analysis prompt. Stores returned recommendations in `ai_recommendations` table with type RESPONSE. Returns array of recommendations. Requires ADMIN role (403 otherwise). |
| 3  | POST /api/ai/predict endpoint                     | Accepts `{ disasterEventId }` (the approaching event). Fetches approaching event details + all historical events with their update timelines. Calls Claude with preparedness prompt. Stores returned predictions in `ai_recommendations` table with type PREPAREDNESS. Returns predictions. Requires ADMIN role. |
| 4  | GET /api/ai/recommendations endpoint              | Accepts `?eventId=` query param. Returns all stored recommendations for that event, sorted by priority (CRITICAL first) then createdAt (newest first). Filterable by `?type=RESPONSE` or `?type=PREPAREDNESS`. |
| 5  | Admin dashboard — AI panel (response mode)        | Right sidebar panel titled "AI recommendations". Shows list of recommendation cards. Each card shows: priority badge (color-coded), recommendation text, reasoning (expandable), target shelter name (if applicable), timestamp. "Analyze network" button at top triggers POST /api/ai/analyze. Loading state while Claude processes. New recommendations pushed to panel via Socket.io. |
| 6  | Admin dashboard — preparedness view               | Separate page/tab accessible from nav. Shows: approaching event details, prediction results grouped by category (capacity predictions, resource predictions, pre-positioning suggestions, timeline). "Run predictions" button triggers POST /api/ai/predict. Loading state (may take 10-20 seconds for Claude to process). Results persist — revisiting page shows last predictions. |
| 7  | Seed historical disaster events                   | Run `node prisma/seed/disasters.js`. Creates 2 events: Hurricane Melissa (Cat 3) and Tropical Storm Nicole (Cat 1). Each event has 50-80 shelter_updates with realistic degradation patterns. Verify: `SELECT COUNT(*) FROM shelter_updates WHERE disaster_event_id IS NOT NULL` returns 80-160 rows. |
| 8  | Claude response caching                           | AI responses cached on server side (in-memory object with 5-minute TTL). Repeated "Analyze" clicks within 5 minutes return cached result without new Claude API call. Cache key includes disasterEventId + timestamp rounded to 5-min window. Prevents accidental API cost spikes during demo. |
| 9  | Socket.io emit on new recommendation              | When POST /api/ai/analyze completes, emit `ai:recommendation` event to admin room with new recommendations. Admin panel updates without refresh. |

**Phase 6 exit gate:**
1. Log in as admin, navigate to dashboard
2. Click "Analyze network" → within 15 seconds, see 3-5 AI recommendations with priorities and reasoning
3. Recommendations appear in panel without page refresh
4. Navigate to preparedness view, click "Run predictions" against a seeded approaching event
5. See structured predictions: which shelters will fill first, where to pre-position supplies
6. Click "Analyze network" again within 5 minutes → response is instant (cached)

---

### Phase 7: Hardening + deployment (hours 19–22) — P1-5 through P1-9

**Goal:** Offline resilience, Docker packaging, AWS deployment, CI/CD.

| #  | Action item                                       | Acceptance criteria                                                                                           |
|----|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1  | Shelter manager — offline update queue            | When navigator.onLine is false: submitting an update saves it to IndexedDB instead of calling API. ConnectionStatus shows "Offline — updates will send when reconnected". When connection restored: all queued updates auto-submitted in order. Success confirmation shown for each. Queue survives page refresh (IndexedDB persistence). Verify: disable network → submit 3 updates → enable network → all 3 appear in DB with correct timestamps. |
| 2  | Admin dashboard — offline shelter detection       | Shelters with no update in 30+ minutes automatically shown as gray pins. Hover card shows "Last seen 47 minutes ago" (dynamic relative time). When a gray shelter submits a new update, pin transitions from gray to appropriate color. Threshold (30 min) configurable in server config. |
| 3  | Server Dockerfile                                 | `docker build -t dprp-server .` succeeds. `docker run -p 3000:3000 dprp-server` starts server. Health check endpoint GET /api/health returns 200. Image size < 500MB. |
| 4  | Docker Compose (local dev)                        | `docker-compose up` starts server + PostgreSQL. Server connects to Postgres automatically. Seed script runs successfully against containerized Postgres. All API endpoints functional. |
| 5  | AWS EC2 deployment — API server                   | Server running on EC2 instance. Accessible via public IP:3000 (or configured port). Connected to RDS PostgreSQL. Socket.io connections work through EC2. `curl http://<EC2-IP>:3000/api/health` returns 200 from local machine. |
| 6  | AWS RDS deployment — PostgreSQL                   | RDS PostgreSQL instance running. Seed script executed against RDS. `SELECT COUNT(*) FROM shelters` returns 915. EC2 server connects to RDS without errors. |
| 7  | Deploy PWAs to AWS                                | All 3 PWA production builds accessible via URLs. Admin at /admin, Shelter manager at /shelter, Resident at /. Static files served from EC2 Express or S3 bucket. All 3 can communicate with API server. CORS configured for deployed origins. |
| 8  | GitHub Actions CI/CD                              | `.github/workflows/deploy.yml` exists. Push to main branch triggers: install deps → build all 3 clients → (optionally) run tests → deploy to EC2 via SSH/SCP. Workflow succeeds on push. Deploy visible within 5 minutes of push. |
| 9  | Environment variables secured                     | No secrets in code or Git history. .env.example exists with placeholder values. Production secrets set via EC2 environment or AWS Parameter Store. JWT_SECRET and ANTHROPIC_API_KEY not exposed in client bundles. |

**Phase 7 exit gate:**
1. Open deployed admin URL in browser → map loads with 915 shelters
2. Open deployed shelter manager URL on phone → submit update
3. Admin dashboard pin changes color in real-time
4. Open deployed resident URL on phone → GPS → shelter cards appear
5. Push a commit to main → GitHub Action triggers → change visible on deployed site within 5 minutes
6. Shelter manager: disable WiFi → submit update → shows "queued" → enable WiFi → update appears on admin dashboard

---

### Phase 8: Polish + demo prep (hours 22–24) — P2 items as time allows

**Goal:** Demo-ready polish and end-to-end rehearsal.

| #  | Action item                                       | Acceptance criteria                                                                                           |
|----|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1  | Loading states across all apps                    | Every API call shows a loading indicator. No blank screens while data loads. Admin map shows skeleton/spinner before pins render. |
| 2  | Error boundaries                                  | React error boundaries on all 3 apps prevent white screen crashes. Errors show friendly "Something went wrong" message with retry option. |
| 3  | Seed "live" demo disaster event                   | Create an ACTIVE disaster event: "Hurricane Dwayne" (Category 3). Affected parishes: St. James, Trelawny, Hanover, Westmoreland. Some shelters in those parishes have recent updates at various levels. |
| 4  | Demo script rehearsal                             | Run the full 5-minute demo script (section 13) end-to-end without errors. Every click/tap produces the expected result. AI analysis returns within 15 seconds. No console errors visible. |
| 5  | Demo failsafe preparation                         | If deployed AWS goes down: local Docker Compose can start the full stack within 2 minutes. Demo data seeded locally. Have mobile hotspot as backup internet for live demo. Pre-generated AI responses saved in case Claude API is slow during demo. |

**Phase 8 exit gate:**
1. Full demo script runs in under 5 minutes with zero errors
2. Team member who is NOT the developer can follow the demo script and execute it
3. Local Docker fallback tested and working

---

## 13. Demo script outline

**Opening (30s):** "When hurricanes hit Jamaica, responders coordinate through radio calls and paper forms. During Hurricane Melissa, ODPEM had no single view of which shelters were full, which were running out of water, and where to redirect people. DPRP changes that."

**Resident experience (60s):** Open the resident finder on a phone. GPS auto-detects location. Instantly shows the 5 nearest shelters with capacity and distance. Zero taps. "In a hurricane, you shouldn't have to think. Just open the page."

**Shelter manager experience (60s):** Log in as a shelter manager. Show the icon-tap interface. Tap 4 people (near capacity), tap 1 water bottle (running low), tap 3 food, tap 4 medical. Hit send. "This takes 3 seconds on a bad connection."

**Admin experience (90s):** Switch to admin dashboard. Show the map with 915 real ODPEM shelters. Point out the pin that just changed from green to amber. Hover to show the card. Click "Analyze network." Show AI recommendations appearing: "Shelter X in St. Thomas at 80% capacity, water critical. Redirect new arrivals to Shelter Y, 4km away at 30% capacity."

**Preparedness (60s):** "But DPRP doesn't just respond — it predicts." Show the preparedness view. "A Category 3 hurricane is approaching the southern parishes. Based on data from Hurricane Melissa and Tropical Storm Nicole, the AI predicts these 5 shelters will reach capacity first and recommends pre-positioning water supplies here, here, and here — before landfall."

**Close (30s):** "Every activation builds institutional memory. Every response makes the next one smarter. DPRP is the platform Jamaica's disaster responders needed — and now it exists."

---

## 14. Judging criteria alignment

| Criteria                        | Weight | How DPRP scores                                                |
|---------------------------------|--------|----------------------------------------------------------------|
| Technical execution             | 30%    | Event-driven architecture, real-time Socket.io, Prisma ORM, JWT auth, Claude API integration, PWA with service workers |
| Innovation & creativity         | 20%    | AI preparedness predictions from historical data, zero-tap resident UX, icon-tap shelter reporting for disaster conditions |
| User experience & design        | 15%    | Three purpose-built interfaces for three user types, offline-first design, mobile-first for field use, color-coded map with instant visual comprehension |
| Impact & business viability     | 20%    | Real ODPEM data (915 shelters), addresses documented failures during Hurricane Melissa, ready for ODPEM pilot |
| Presentation & communication    | 15%    | Live demo showing real-time data flow, before/after narrative |

### SPAIN framework coverage
| Pillar      | Evidence                                                        |
|-------------|----------------------------------------------------------------|
| Stability   | PWA offline caching, service workers, graceful reconnection, offline update queue |
| Performance | Socket.io for instant updates, < 100KB shelter app bundle, system fonts, no images, sub-2s load on 3G |
| Availability| Offline-first design, cached last-known data, public resident endpoint, IndexedDB queue |
| Integrity   | Append-only update log, JWT auth, role-based access, AI audit trail, cached AI responses |
| Novelty     | AI preparedness predictions, historical pattern analysis, zero-tap UX, icon-tap low-bandwidth reporting |

---

## 15. Environment variables

```env
# Server
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dprp
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Client URLs (for CORS)
ADMIN_URL=https://admin.dprp.app
SHELTER_URL=https://shelter.dprp.app
RESIDENT_URL=https://dprp.app

# Thresholds
SHELTER_OFFLINE_THRESHOLD_MINUTES=30
AI_CACHE_TTL_MINUTES=5
```

---

## 16. Risk register

| Risk                                    | Impact | Mitigation                                           |
|-----------------------------------------|--------|------------------------------------------------------|
| Geocoding fails / no lat/lng            | High   | Fall back to parish centroid coordinates              |
| Claude API rate limits during demo      | High   | Cache last AI response (5-min TTL), pre-generate for demo |
| Socket.io disconnects during demo       | Medium | Auto-reconnect built into Socket.io, show reconnecting state |
| AWS deployment issues                   | High   | Have local Docker fallback ready, can demo from laptop |
| GPS denied on resident finder           | Medium | Parish dropdown fallback                              |
| Time overrun on P0                      | High   | Cut P0-15 (service workers) last — add in Phase 7    |
| Database connection drops               | Medium | Prisma connection pooling, retry logic                |
| Slow 3G during demo                     | Medium | All apps functional offline after first load          |
| Claude returns malformed JSON           | Medium | Wrap AI parsing in try/catch, validate structure before storing |
| Demo phone GPS inaccurate              | Low    | Have known lat/lng ready to manually pass to API      |
