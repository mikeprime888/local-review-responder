# CLAUDE.md - Local Review Responder

## Project Overview
Private review-management tool (not a public SaaS) that integrates with the Google Business Profile API to fetch and respond to customer reviews with AI-generated responses. Only allowlisted Google accounts can sign in; there is no billing or registration.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (no component libraries)
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Auth:** NextAuth.js (Google OAuth only, gated by `ALLOWED_EMAILS` allowlist)
- **Billing:** None — Stripe was removed. `Location.isActive` is the entitlement switch.
- **AI:** OpenAI GPT-4o-mini for review response generation
- **Email:** Gmail SMTP via nodemailer, sent as `GMAIL_USER`. Only email: the daily new-review alert from the cron (respects `User.notifyNewReviews`)
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
    dashboard/            # Dashboard pages (reviews, locations, widget, etc.)
    login/                # Login page
  components/
    dashboard/            # All dashboard UI components
    AIResponseGenerator.tsx
  lib/
    auth.ts               # NextAuth config, token refresh logic
    google-business.ts    # Google Business Profile API client
    email.ts              # sendEmail (Gmail SMTP) & new-reviews email template
    prisma.ts             # Prisma singleton
    cron-auth.ts          # CRON_SECRET check (fails closed)
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
- Unused schema leftovers, kept until a later cleanup: `Subscription`, `User.stripeCustomerId`, `isComped`/`compedAt`/`compedNote`, `notifyLowRated`/`notifyWeeklyDigest`, `password`.

### OpenAI
- Model: `gpt-4o-mini`, temperature 0.7
- Generates 3 tone variations per review (professional, friendly, contextual)
- 50-100 word responses (shorter for comment-only reviews)

## Environment Variables
- `DATABASE_URL` / `DIRECT_URL` - Neon PostgreSQL
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` - NextAuth config
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `ALLOWED_EMAILS` - Comma-separated sign-in allowlist (unset/empty = nobody can sign in)
- `CRON_SECRET` - Bearer token for the cron and `/api/test-email` (unset = rejected)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` - Gmail SMTP email delivery
- `OPENAI_API_KEY` - AI responses
- `NEXT_PUBLIC_APP_ORIGIN` - Optional; origin in the widget embed snippet

## Important Notes
- Google OAuth requires `business.manage` scope for GBP access
- Reviews sync daily at 7 AM UTC via Vercel cron (`/api/cron/sync-reviews`)
- Test email delivery: `GET /api/test-email` with `Authorization: Bearer $CRON_SECRET` sends a sample alert to `GMAIL_USER`
- Widget allows embedding published reviews on customer websites
- Admin panel at `/dashboard/admin` for user management
