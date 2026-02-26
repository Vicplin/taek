# TAEK — Taekwondo Registration & Management Platform

SaaS platform for the Taekwondo community across Malaysia and Southeast Asia.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | C# ASP.NET Core 8 Web API |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (JWT + RLS) |
| Storage | Supabase Storage |
| Hosting | Vercel (frontend) + Railway / Azure (API) |

## Monorepo Structure

```
taek/
├── frontend/       # Next.js 14 app (deployed to Vercel)
├── backend/        # C# ASP.NET Core 8 API (deployed to Railway / Azure)
└── .github/
    └── workflows/  # CI/CD pipelines
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
cd backend
cp appsettings.Example.json appsettings.Development.json   # fill in your Supabase credentials
dotnet restore
dotnet run                    # http://localhost:5000
```

## Environment Setup

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (`backend/appsettings.Development.json`)
```json
{
  "Supabase": {
    "Url": "your_supabase_project_url",
    "AnonKey": "your_supabase_anon_key",
    "ServiceRoleKey": "your_supabase_service_role_key"
  },
  "ConnectionStrings": {
    "DefaultConnection": "your_supabase_postgres_connection_string"
  }
}
```

## Development Roadmap

| Phase | Timeline | Goal |
|-------|----------|------|
| Phase 0 | Wk 1-2 | Skeleton deployed (repo, Vercel, Railway, Supabase) |
| Phase 1 | Wk 3-4 | Auth + role-based login |
| Phase 2 | Wk 5-6 | Player / Coach / Organiser profiles |
| Phase 3 | Wk 7-8 | Events + categories |
| Phase 4 | Wk 9-10 | Registration engine (core MVP) |
| Phase 5 | Wk 10-11 | Organiser approval workflow |
| Phase 6 | Wk 11-13 | Receipt-based payment system |
| Phase 7 | Wk 13-14 | Polish + pilot onboarding |

---
Prepared by: Jaden | jadckh@gmail.com
