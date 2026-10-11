# Local Review Responder

A private tool for managing Google Business Profile (GBP) reviews: sync reviews, reply with AI-drafted responses, get a daily email when new reviews arrive, and embed a review widget on business websites.

It is not a public SaaS. Only allowlisted Google accounts can sign in, and there is no billing.

## How access works

- **Sign-in:** Google OAuth only. A Google account can sign in only if its email is listed in `ALLOWED_EMAILS`. Rejected attempts are logged as `[auth] sign-in rejected: ...`.
- **Locations:** after signing in, a user picks their GBP locations on **Add Location**, which calls `POST /api/locations/activate`. `Location.isActive` is the only entitlement switch: the nightly sync and the public widget serve active locations only. There is no UI to deactivate a location; set `isActive = false` in the database.
- **Email:** the only email is the daily new-review alert, sent by the cron through Gmail SMTP as `GMAIL_USER`. Users can turn it off on the Notifications page (`User.notifyNewReviews`).
- **Admin:** `/dashboard/admin` (users with `isAdmin`) lists users and can delete non-admin users.

## Tech stack

- Next.js 14 (App Router, TypeScript), Tailwind CSS
- PostgreSQL on Neon via Prisma
- NextAuth.js (Google provider)
- Google Business Profile APIs, OpenAI `gpt-4o-mini`
- nodemailer (Gmail SMTP)
- Vercel hosting with a daily cron

## Environment variables

Set these in Vercel for Production and Preview. `.env.example` lists the same set.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon pooled connection string |
| `DIRECT_URL` | yes | Neon direct connection string (used by Prisma) |
| `NEXTAUTH_URL` | yes | Public base URL of the deployment, e.g. `https://app.localreviewresponder.com` |
| `NEXTAUTH_SECRET` | yes | NextAuth signing secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | yes | Google OAuth client |
| `ALLOWED_EMAILS` | yes | Comma-separated emails allowed to sign in. Unset or empty means nobody can sign in |
| `CRON_SECRET` | yes | Bearer token for `/api/cron/sync-reviews` and `/api/test-email`. Unset means both reject every request |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | yes | Gmail account and App Password used to send alerts |
| `OPENAI_API_KEY` | yes | AI response generation |
| `NEXT_PUBLIC_APP_ORIGIN` | no | Origin shown in the widget embed snippet. Defaults to `https://app.localreviewresponder.com` |

Vercel applies env var changes on the next deployment, so redeploy after editing `ALLOWED_EMAILS` or any other variable.

## Google Cloud setup

1. **OAuth client** (APIs & Services → Credentials). Add these authorized redirect URIs for every deployment URL you use (production, and the preview if you sign in there):
   - `<NEXTAUTH_URL>/api/auth/callback/google` (sign-in)
   - `<NEXTAUTH_URL>/api/auth/link-google/callback` (linking a different Google account from onboarding)
2. **APIs to enable:**
   - My Business Account Management API (`mybusinessaccountmanagement.googleapis.com/v1`): list accounts
   - My Business Business Information API (`mybusinessbusinessinformation.googleapis.com/v1`): list locations
   - Google My Business API v4 (`mybusiness.googleapis.com/v4`): reviews and replies
3. Sign-in requests the `business.manage` scope with `prompt: consent`, so users see the Business Profile permission screen.

## Gmail setup

`GMAIL_USER` must be a Google account with 2-Step Verification turned on. Create an App Password for it and put that in `GMAIL_APP_PASSWORD`. On Google Workspace, the admin console must allow app passwords.

To test delivery after a deploy:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<host>/api/test-email
```

It sends a sample alert to `GMAIL_USER` and returns `{"sent":true,...}`, or the SMTP error.

## Cron

`vercel.json` runs `GET /api/cron/sync-reviews` daily at 07:00 UTC (3 AM EDT / 2 AM EST). Vercel sends `Authorization: Bearer $CRON_SECRET`. For each active location it syncs reviews, then emails each user who has new reviews and has alerts turned on.

## Development workflow

- Work on the `dev` branch. Vercel builds a preview from it; `main` deploys to production.
- Changes are verified on the Vercel preview, not on localhost.
- Database schema changes use `npx prisma db push` (not `migrate dev`). Confirm which Neon branch `DATABASE_URL` points at first; see `docs/lrr-ops-notes.md`.

```bash
npm install
npx tsc --noEmit   # typecheck
npm run lint
npm run build      # runs prisma generate first
```

## Troubleshooting

- **Sign-in bounces back to `/login`:** check the Vercel logs for `[auth] sign-in rejected`. The line shows how many allowlist entries the server parsed and whether `ALLOWED_EMAILS` was present.
- **"Invalid redirect_uri":** the redirect URI for the URL you're using is missing from the OAuth client, or `NEXTAUTH_URL` doesn't match the deployment URL.
- **"Permission denied" from Google APIs:** sign out and back in to grant `business.manage`, and check the three APIs above are enabled.
- **No locations found:** the signed-in Google account must be an Owner or Manager on the Business Profile (business.google.com → Manage → Users).
- **Reviews missing:** reviews require verified locations. Sync locations before reviews.
- **No alert emails:** call `/api/test-email`. A 535 error means the App Password is wrong or 2-Step Verification is off.
