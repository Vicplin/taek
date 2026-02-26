# TAEK — Taekwondo Registration & Management Platform

SaaS platform for the Taekwondo community across Malaysia and Southeast Asia.

## Stack

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | |
| Backend API | C# ASP.NET Core 8 | |
| Database | Supabase (PostgreSQL 15) | |
| Auth | Supabase Auth (JWT + RLS) | |
| Storage | Supabase Storage | Profile photos, receipts, documents |
| Realtime | Supabase Realtime | Live registration status updates |
| Email | Resend | Transactional + campaign emails |
| Payments | Xendit | FPX, DuitNow, GrabPay, TNG (post-MVP) |
| Frontend hosting | Vercel | Auto-deploy from `main` |
| Backend hosting | Railway | C# API, auto-deploy from `main` |
| DNS + CDN + Protection | Cloudflare | DDoS protection, proxy for API subdomain |
| Domain registrar | Namecheap | Domain TBD |

## Infrastructure Overview

```
User
 │
 ├── taek.my  ──────────────►  Cloudflare (DNS only) ──► Vercel (Next.js)
 │
 └── api.taek.my  ──────────►  Cloudflare (Proxied 🟠) ──► Railway (C# API)
                                                                  │
                                                             Supabase (DB)
```

> **Cloudflare proxy rules:**
> - `taek.my` → **Grey cloud (DNS only)** — Vercel manages its own CDN + SSL
> - `api.taek.my` → **Orange cloud (Proxied)** — Cloudflare provides DDoS protection on the API

## Monorepo Structure

```
taek/
├── frontend/               # Next.js 14 app → deployed to Vercel
│   ├── src/
│   │   ├── app/            # App Router pages (auth, player, coach, organiser, admin)
│   │   ├── components/     # Reusable UI + layout components
│   │   ├── lib/            # Supabase client, API wrappers
│   │   └── types/          # Shared TypeScript interfaces
│   └── ...
├── backend/                # C# ASP.NET Core 8 API → deployed to Railway
│   └── Taek.Api/
│       ├── Controllers/    # REST API controllers per module
│       ├── Services/       # Business logic (eligibility engine, notifications)
│       ├── Models/         # DB entity models
│       ├── DTOs/           # Request / response data transfer objects
│       └── Middleware/     # JWT validation, role enforcement
└── .github/
    └── workflows/          # CI/CD — frontend and backend build checks
```

## Getting Started

### Prerequisites
- Node.js 20+
- .NET 8 SDK
- A Supabase project (see Environment Setup below)

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev                   # http://localhost:3000
```

### Backend
```bash
cd backend/Taek.Api
cp appsettings.Example.json appsettings.Development.json   # fill in your credentials
dotnet restore
dotnet run                    # http://localhost:5000
# Swagger UI: http://localhost:5000/swagger
```

## Environment Setup

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (`backend/Taek.Api/appsettings.Development.json`)
```json
{
  "Supabase": {
    "Url": "https://your-project-ref.supabase.co",
    "AnonKey": "your-anon-key",
    "ServiceRoleKey": "your-service-role-key",
    "JwtSecret": "your-jwt-secret-from-supabase-dashboard"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.your-project-ref.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=your-db-password;SSL Mode=Require;"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  }
}
```

> ⚠️ Never commit `appsettings.Development.json` or `.env.local` — both are in `.gitignore`.

## DNS Setup (Cloudflare)

Once your domain is registered on Namecheap, point its nameservers to Cloudflare. Then add these records in Cloudflare:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | DNS only (grey) |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only (grey) |
| CNAME | `api` | `your-app.up.railway.app` | Proxied (orange) |

## Development Roadmap

| Phase | Timeline | Goal | Status |
|-------|----------|------|--------|
| Phase 0 | Wk 1-2 | Skeleton deployed (repo, Vercel, Railway, Supabase) | ✅ In progress |
| Phase 1 | Wk 3-4 | Auth + role-based login | ⬜ |
| Phase 2 | Wk 5-6 | Player / Coach / Organiser profiles | ⬜ |
| Phase 3 | Wk 7-8 | Events + categories | ⬜ |
| Phase 4 | Wk 9-10 | Registration engine (core MVP) | ⬜ |
| Phase 5 | Wk 10-11 | Organiser approval workflow | ⬜ |
| Phase 6 | Wk 11-13 | Receipt-based payment system | ⬜ |
| Phase 7 | Wk 13-14 | Polish + pilot onboarding | ⬜ |

## Phase 0 Checklist

- [ ] GitHub monorepo created and pushed
- [ ] Supabase project created (Auth, Storage, Realtime enabled)
- [ ] Next.js skeleton deployed to Vercel — live URL confirmed
- [ ] C# API skeleton deployed to Railway — `/health` returns 200
- [ ] MVP database schema created in Supabase (5 core tables)
- [ ] RLS policies written and tested for all 5 tables
- [ ] Domain purchased and pointed to Cloudflare nameservers
- [ ] Cloudflare DNS records configured for frontend and API

---
Prepared by: Jaden | jadckh@gmail.com | v0.1.0 — Phase 0
