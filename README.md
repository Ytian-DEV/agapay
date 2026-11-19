# Agapay — Plant at the Right Time

**Agapay** (by Team BukidTech, Visayas State University) is a mobile-first **Progressive Web App (PWA)** designed for Filipino smallholder farmers and Local Government Units (starting with **Baybay City, Leyte**).

## Key Features
- **Hyper-Local Planting Windows & Map:** 4-layer Baybay City weather-crop suitability map (Suitability, Rain, Soil Moisture, Flood Risk) with honest uncertainty & technician-reviewed advisories.
- **Offline-First Rural Resilience (PWA):** Service-worker precaching (`vite-plugin-pwa`), local report queue (rain check-ins, harvest logs, advisory flags), automatic **72-hour stale-cache warnings**, and **SMS gateway fallback** preview for basic phones.
- **10 Philippine Languages (`react-i18next`):** English, Filipino (Tagalog), Cebuano (Bisaya), Waray, Hiligaynon (Ilonggo), Ilokano, Bikol, Kapampangan, Pangasinan, and Maguindanaon (`src/locales/*.json`).
- **Crop Intelligence & Offline Guides:** Online AI Top-3 crop suggestions with crowding indicators (enforcing the **≥5 reporting farmers** cold-start/privacy rule), side-by-side crop comparison, free offline planting & drainage guides, pre-planting yield estimates (`sacks/ha`), harvest feedback, and forecast accuracy tracking.
- **RA 10173 Privacy & LGU Business Dashboard:** Granular informed consent + withdrawal, pseudonymized parcel IDs, satellite data sources register, and an aggregated barangay-only LGU workspace with working **CSV & Print/PDF export**.
- **Capacitor / Mobile Ready:** Mobile-safe viewport (`viewport-fit=cover`), CSS safe-area insets (`env(safe-area-inset-*)`), ≥48px outdoor-readable touch targets, and Light/Dark mode.

## Quick Start
```bash
npm install
npm run dev
```

## Production Build (with PWA Service Worker)
```bash
npm run build
npm run preview
```

## Supabase Setup
1. Open the SQL Editor in your Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) to create tables, `v_barangay_crowding` (enforcing `>= 5` reporting farmers), and Row-Level Security policies.
3. Run [`supabase/seed.sql`](supabase/seed.sql) for Baybay City barangays, crops, offline crop guides, advisories, alerts, and data sources.
4. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. (Without env vars, Agapay runs seamlessly in offline-first local mode.)
