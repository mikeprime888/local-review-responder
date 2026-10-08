# CLAUDE.md - Local Review Responder

## Project Overview
SaaS reputation management app that integrates with Google Business Profile API to help businesses fetch and respond to customer reviews with AI-generated responses.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (no component libraries)
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Auth:** NextAuth.js (Google OAuth only, gated by `ALLOWED_EMAILS` allowlist)
- **Billing:** None — Stripe was removed. `Location.isActive` is the entitlement switch.
- **AI:** OpenAI GPT-4o-mini for review response generation
- **Email:** SendGrid (welcome, new review alerts, account notifications)
- **Hosting:** Vercel with daily cron job for review sync

## Key Commands
```bash
npm run dev          # Start dev server
npm run build        # Build (runs prisma generate first)
npm run lint         # ESLint
npm run db:push      # Push Prisma schema to database
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio
```

## Project Structure
```
src/
  app/                    # Next.js App Router pages & API routes
    api/
      auth/               # NextAuth, Google account linking
      google/             # GBP accounts, locations, reviews, replies
      ai/                 # OpenAI response generation
      locations/          # Location list (GET) & activation
      reviews/[id]/       # Review publish toggle (widget)
      widget/             # Widget API & settings
      settings/           # Account & notification preferences
      cron/               # Scheduled review sync
      admin/              # Admin user management
      places/             # Google Places search
    dashboard/            # Dashboard pages (reviews, locations, widget, etc.)
    login/                # Login page
  components/
    dashboard/            # All dashboard UI components
    AIResponseGenerator.tsx
  lib/
    auth.ts               # NextAuth config, token refresh logic
    google-business.ts    # Google Business Profile API client
    email.ts              # SendGrid email templates
    prisma.ts             # Prisma singleton
    utils.ts              # Date formatting, truncate, initials
  types/
    next-auth.d.ts        # Session/JWT type extensions
prisma/
  schema.prisma           # Database schema
```

## Conventions

### API Routes
- Next.js 13+ App Router async handlers (GET, POST, PATCH, DELETE)
- Auth via `getServerSession(authOptions)` at top of each route
- Return `NextResponse.json()` with consistent error messages
- Query params use camelCase: `?locationId=xxx&sync=true`

### Components
- `'use client'` directive for client components
- PascalCase filenames: `ReviewList.tsx`, `StatsBar.tsx`
- Props typed with interfaces (e.g., `interface ReviewListProps`)
- State managed with React hooks (`useState`, `useEffect`, `useCallback`)
- Dashboard components exported via `components/dashboard/index.ts`

### Database
- Prisma singleton imported as `import { prisma } from '@/lib/prisma'`
- Composite unique keys used (e.g., `userId_googleAccountId_locationId`)
- camelCase field names throughout

### Styling
- Tailwind utility classes only (no CSS modules, no styled-components)
- Blue primary color palette
- Responsive with `sm:`, `lg:` breakpoints

### Path Aliases
- `@/*` maps to `./src/*`

## Key Integrations

### Google Business Profile API
- Account Management API v1 for accounts/locations
- My Business API v4 for reviews (still v4, not yet migrated)
- Token refresh handled automatically via `getValidAccessToken()`
- Per-account iteration for locations (not wildcard endpoint)

### Billing (removed)
- LRR is a private tool for allowlisted users; Stripe billing has been removed.
- `Location.isActive` is the only entitlement signal: review sync and widgets serve active locations only.
- Users activate their own locations via `POST /api/locations/activate`.
- `Subscription`, `stripeCustomerId` and `isComped` remain in `prisma/schema.prisma` for now but are unused.

### OpenAI
- Model: `gpt-4o-mini`, temperature 0.7
- Generates 3 tone variations per review (professional, friendly, contextual)
- 50-100 word responses (shorter for comment-only reviews)

## Environment Variables
- `DATABASE_URL` / `DIRECT_URL` - Neon PostgreSQL
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` - NextAuth config
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `SENDGRID_API_KEY` - Email delivery
- `OPENAI_API_KEY` - AI responses

## Important Notes
- Google OAuth requires `business.manage` scope for GBP access
- Reviews sync daily at 7 AM UTC via Vercel cron (`/api/cron/sync-reviews`)
- Widget allows embedding published reviews on customer websites
- Admin panel at `/dashboard/admin` for user management
