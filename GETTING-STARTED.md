# DPRP — Quick Start Guide

**Disaster Preparedness & Response Platform for Jamaica**
Live at: `https://dprp-staging.up.railway.app`

---

## Three Apps, One Platform

| App | URL Path | User | Login |
|-----|----------|------|-------|
| **Admin Dashboard** | `/` | Emergency coordinators | `admin@dprp.gov.jm` / `admin123` |
| **Shelter Manager** | `/shelter/` | On-the-ground shelter staff | `shelter@dprp.gov.jm` / `shelter123` |
| **Resident Finder** | `/resident/` | General public | No login required |

---

## What Each App Does

### Admin Dashboard
Real-time command center for 915 shelters across Jamaica's 14 parishes.
- **Interactive map** with color-coded shelter pins (green/amber/red/gray)
- **Live updates** via WebSocket — shelter reports appear as toast notifications instantly
- **IRIS AI** — click Analyze for prioritized directives (redirect, resupply, dispatch)
- **Broadcasts** — send priority alerts to shelter managers by parish
- **Preparedness analytics** — resource gaps, vulnerability maps, scenario modeling

### Shelter Manager
Mobile-first reporting tool for shelter staff.
- **Tap to report** 4 metrics on a 1-5 scale: capacity, water, food, medical
- **Optional notes** for urgent context (280 chars)
- **Connection status bar** always visible — shows online/offline state
- **Broadcast alerts** from admin appear as priority-styled banners

### Resident Finder
Lightweight public shelter locator (~150KB).
- **Auto GPS** — finds your location and shows the 5 nearest shelters
- **Distance + status** — capacity, water, food, medical at a glance
- **Get Directions** — one tap opens Google Maps
- **Parish fallback** — manual selection if GPS is denied or unavailable

---

## Built for Low Bandwidth & Unreliable Networks

Disaster situations in Jamaica mean degraded infrastructure — cell towers down, spotty connectivity, power outages. Every design decision prioritizes **data reliability** over data richness.

### Offline-First Shelter Manager
The Shelter Manager is built to work **without an internet connection**:
- Updates are stored in a **local offline queue** when connectivity drops
- The connection bar turns red ("Offline — X updates queued") so staff always know their state
- When connectivity returns, queued updates **auto-flush** to the server in order
- Failed sends **retry up to 5 times** before reporting partial failure
- Session expiry is handled gracefully — staff are prompted to re-authenticate without losing queued data

### Service Worker Caching (All 3 Apps)
Each app is a **Progressive Web App** with Workbox-powered service workers:
- App shells are cached — the UI loads even offline
- API responses use **NetworkFirst** strategy with 1-hour fallback cache
- Map tiles are cached for 7 days (admin dashboard)
- The Resident Finder caches its last shelter results in localStorage with timestamps, showing "last known data" when offline

### Minimal Payloads
- Shelter updates are a **single POST** with 4 integers + optional text — under 200 bytes
- The Resident Finder is ~150KB total — loads on 2G connections
- Socket.io auto-negotiates between WebSocket and HTTP long-polling based on network capability

### Installable PWAs
All three apps can be **installed to the home screen** on any device — no app store required. Once installed, they launch instantly from cache.

---

## Demo Walkthrough

1. **Open Admin Dashboard** (`/`) and **Shelter Manager** (`/shelter/`) side by side
2. In the Shelter Manager, pick a parish and shelter, set the 4 levels, tap **Send update**
3. Watch the update appear on the Admin Dashboard as a **live toast notification** — click it to fly the map to that shelter
4. On the Admin Dashboard, click **Analyze** in the IRIS panel to see AI-generated directives
5. Send a **Broadcast** from the admin — it appears instantly on the Shelter Manager
6. Open **Resident Finder** (`/resident/`) on a phone, allow GPS, and see nearby shelters ranked by distance with directions

---

*Built for the Jamaica Hackathon 2026 — 915 ODPEM-registered shelters, real-time coordination, AI-powered decision support.*
