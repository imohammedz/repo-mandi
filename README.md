# RepoMandi Stage 1 MVP

Mobile-first Next.js marketplace for repossessed / bank-seized commercial vehicles in India.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM with PostgreSQL-ready schema
- Server Actions + API routes for listing workflows
- Mock sample data fallback for local MVP use

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Key routes
- `/` landing page
- `/vehicles` listing page with filters
- `/vehicles/[id]` vehicle details with Call/WhatsApp CTAs
- `/producer` producer dashboard
- `/producer/add` add vehicle form
- `/admin` admin dashboard for verification actions

## Prisma
Schema is in `prisma/schema.prisma` and is PostgreSQL-ready.
Use mock data now; connect DB later by setting `DATABASE_URL`.
