<!-- ========================================================================
     ORIENTATION FOR A NEW CLAUDE CODE SESSION
     Read this block in full before reading any other file or making any change.
     A fresh Claude Code session has no memory of prior work — these are the
     non-obvious rules that prevent errors. Re-read if unsure.
     ======================================================================== -->

# Claude Code — Session Orientation

## What this repo is
**Local Review Responder (LRR)** — a private tool (not a public SaaS) for managing and responding to Google Business Profile (GBP) reviews, and embedding a review widget on business sites. Only allowlisted Google accounts can sign in; there is no billing.
Stack: **Next.js 14 (App Router, TypeScript)**, Prisma ORM, Neon PostgreSQL, NextAuth.js (Google OAuth), Tailwind CSS, Vercel hosting, OpenAI GPT-4o-mini, Gmail SMTP (nodemailer), GBP APIs.

## Environment — read before you assume anything
- **There is NO local dev environment.** Code is not run on localhost. Changes are tested on the **Vercel preview deploy** (built from the `dev` branch) and, after merge, production. Do not suggest `npm run dev` / localhost testing as the verification step.
- **All app file paths start with `src/app/`**, never bare `app/` (e.g. `src/app/api/widget/[locationId]/route.ts`).
- The OpenAI client is initialized **inside the route handler**, not at module level (avoids build-time errors). Keep it that way.

## Git workflow — follow exactly
1. **Audit first.** Read the relevant files before editing. Report what you found if the task says to.
2. **One file / one concern per commit.** Each commit must be independently revertable. If a requested change is already in place, make NO change — do not invent a no-op commit.
3. **Push after EVERY commit, and confirm it landed on `origin/dev`.** Vercel builds against the remote — a local-only commit produces a stale deploy. State the commit hash and that the push is confirmed.
4. **Work on the `dev` branch by default.** This is the standard; it does not need restating each task.
5. **NEVER merge to `main` without explicit approval in the prompt.** Merges are reviewed on the Vercel preview first. When merging is approved, use `--no-ff` so dev commits stay grouped under one merge commit, and confirm `demo-carousel.js` (and any other main-only files) are preserved.

## Database — Prisma + Neon
- **Use `prisma db push`, NOT `prisma migrate dev`.** Migration history has drifted on live data.
- **Two Neon branches:** Production = **`ep-young-haze`**, Preview = **`ep-misty-bar`** (used by the dev preview build).
- For dev-branch work, schema changes must reach the **preview DB (`ep-misty-bar`)** for the preview build to function. `prisma db push` applies to whatever `DATABASE_URL`/`DIRECT_URL` currently point at — **confirm the target before running it.** If you change `.env` to retarget, restore it afterward and leave the working tree clean (never commit `.env`).
- Prefer **nullable, no-default** columns for additive schema changes so existing rows are unaffected.

## Credentials / safety
- **Never put secrets in code or in this repo.** Reference env vars by name only. If a task needs a connection string or key, stop and ask — do not guess or reuse production values.

## Access model (see "Access & Entitlement" below for detail)
- **Who can sign in:** the `ALLOWED_EMAILS` env allowlist, Google OAuth only.
- **`Location.isActive` is the only entitlement signal.** Sync and widgets serve active locations only. Stripe, subscriptions and comps are gone; `Subscription`, `stripeCustomerId`, `isComped`, `compedAt`, `compedNote` remain in the schema, unused.
- GBP location sync uses `listAccounts()` + `listLocations(accountId)` per account — **not** the `accounts/-/locations` wildcard (it misses `LOCATION_GROUP` account types).

<!-- ===================== END ORIENTATION ===================== -->

---

# LRR Ops Notes

A running notebook of workflows, gotchas, and how-tos for managing Local Review Responder.

---

## Access & Entitlement

### Giving someone access
1. Add their Google email to `ALLOWED_EMAILS` (comma-separated) in Vercel, for Production and/or Preview.
2. **Redeploy** — Vercel applies env var changes on the next deployment only.
3. They sign in with Google, then add their locations on **Add Location** (`POST /api/locations/activate`), which sets `Location.isActive = true` and runs a first review sync.

### Removing access
- Remove the email from `ALLOWED_EMAILS` and redeploy. That blocks new sign-ins only: sessions are JWTs (NextAuth default lifetime, 30 days) and aren't re-checked against the allowlist. Deleting the user from the Admin dashboard removes their data but does not revoke an existing token. To sign everyone out immediately, rotate `NEXTAUTH_SECRET` and redeploy.
- To stop syncing/serving a single location there is no UI — set it inactive in SQL (see Useful queries).

---

## Key Guards & Safety Rules

| Guard | Location | What it does |
|---|---|---|
| Sign-in allowlist | `src/lib/auth.ts` (`isEmailAllowed`, `signIn` callback) | Rejects any email not in `ALLOWED_EMAILS`; fails closed when the var is unset/empty. Logs `[auth] sign-in rejected: ...` (never the allowlist contents) |
| `isActive` gate | `src/app/api/cron/sync-reviews/route.ts`, `src/app/api/widget/[locationId]/route.ts`, `src/app/api/widget/summary/route.ts` | Only active locations are synced and served; inactive → widget 404 |
| Location ownership | `src/app/api/locations/activate/route.ts` | Activation only for a location owned by the session user |
| `CRON_SECRET` | `src/lib/cron-auth.ts` (used by the cron and `/api/test-email`) | Requires `Authorization: Bearer $CRON_SECRET`; returns 500 if the secret is unset, so `Bearer undefined` can never pass |
| Onboarding "already set up" redirect | `src/app/onboarding/page.tsx` | The redirect signal is `locations?.length > 0` (active locations) ONLY. Don't OR `isAdmin` into it, or admins can never complete onboarding |

---

## Admin Dashboard

URL: `app.localreviewresponder.com/dashboard/admin` (requires `User.isAdmin`)

| Action | Notes |
|---|---|
| Delete user | Deletes the user and their data (locations, reviews, widget settings). The admin account itself is protected |

---

## Auth — Google sign-in only

- Sign-in is Google OAuth only, gated by the `ALLOWED_EMAILS` allowlist (`isEmailAllowed` in `src/lib/auth.ts`). Denied sign-ins redirect to `/login?error=AccessDenied` (NextAuth `pages.error = '/login'`).
- There is no registration and no email/password login. The `User.password` column remains in the schema (all values NULL) pending a later cleanup.
- Onboarding's "Connect Google account" / "Try a Different Google Account" use `/api/auth/link-google` to attach another Google account (with GBP access) to the signed-in user. Its callback URL, `<NEXTAUTH_URL>/api/auth/link-google/callback`, must be an authorized redirect URI on the OAuth client.

---

## Neon DB

### Branches
- **Production:** `ep-young-haze`
- **Preview:** `ep-misty-bar` (schema-only, no auto-delete; used by the dev preview build)
- SQL editor branch selector: navigate to the branch in the sidebar FIRST, then open the SQL Editor.

> **Preview seed data:** `ep-misty-bar` contains a seeded test Google `Account` row for `mikeprime888@gmail.com` (`providerAccountId: preview-seed-mikeprime888` — a placeholder, not a real token), added to give that account an OAuth-only shape for testing the (since removed) login detection on preview. Harmless, preview-only, never in production — don't mistake it for real data or a bug, and don't delete it expecting a sync to recreate it.

### Schema-change targeting (important)
`prisma db push` applies to whatever `DATABASE_URL`/`DIRECT_URL` `.env` currently points at. For dev-branch work, the **preview DB (`ep-misty-bar`)** needs the schema or the preview build throws on reads of the new column. Confirm the target before pushing; restore `.env` and leave the tree clean afterward.
> Lesson (this session): a schema push landed on prod instead of preview because `.env` pointed at prod. It was harmless (nullable, no default), but the preview DB then needed a separate push. Always confirm the DB target in schema prompts.

### Useful queries
```sql
-- Check locations for a user
SELECT * FROM "Location"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'user@example.com');

-- Delete all locations for a user
DELETE FROM "Location"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'user@example.com');

-- Active/inactive locations per user
SELECT u.email, l.title, l."isActive"
FROM "Location" l JOIN "User" u ON u.id = l."userId"
ORDER BY u.email, l.title;

-- Stop syncing/serving one location
UPDATE "Location" SET "isActive" = false WHERE id = '<location id>';
```

---

## Email (Gmail SMTP)
- The only email is the daily **new-review alert**, sent by the cron (`/api/cron/sync-reviews`, 07:00 UTC) via `sendEmail()` in `src/lib/email.ts`.
- Sent through `smtp.gmail.com:465` as `GMAIL_USER` (admin@localreviewresponder.com) with `GMAIL_APP_PASSWORD` (a Google App Password; needs 2-Step Verification on the account).
- Skipped for users who turned off **New review alerts** (`User.notifyNewReviews`); their reviews still sync.
- Test delivery: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<host>/api/test-email` sends a sample alert to `GMAIL_USER`.
- Stripe and SendGrid have been removed entirely (code, dependencies, env vars, webhooks).

---

## Review Widget

### Two render paths — KEEP IN SYNC
The widget exists in **two** places that must be changed together for any visual/behavior edit:
1. **`public/widget.js`** — the embed served to customer sites. Plain JS, **inline styles** (built as HTML strings). Inline styles are never purged/transformed by the build.
2. **`src/app/dashboard/widget/page.tsx`** — the in-dashboard **"Live Preview"** (React `ReviewCard`). Uses **sample data** (note the "Sample data" badge) — it does NOT reflect the selected location's real reviews.

> Any widget change (fonts, spacing, colors, truncation, ordering) must be mirrored in BOTH files or the preview and the live embed diverge — a divergence is its own latent bug.

### Data flow
- Public render endpoint: `src/app/api/widget/[locationId]/route.ts` → returns `location` (title, averageRating, totalReviews, mapsUri, placeId, newReviewUri) and `settings` (layout, theme, accentColor, backgroundColor, showDate, showName, showBadge, showHeaderBar, showWriteReviewButton) and `reviews`.
- Settings read/write: `src/app/api/widget/settings/route.ts` — handler is **`PUT`** (not PATCH) + GET. New settings fields must be threaded through BOTH.
- `WidgetSettings` fields added over time: `accentColor`, `backgroundColor` (nullable), `showHeaderBar`/`showWriteReviewButton` (default `true`). `Location` carries `placeId`/`newReviewUri` (backfilled automatically on next GBP sync via expanded readMask — no separate backfill script).

### Color / contrast rules (learned the hard way)
- **Accent color** drives: active carousel dot, the "Write a review" button background, and the "Read more" link.
- **"Write a review" button:** text color = `readableOn(accent)` (readable ON the accent background).
- **"Read more" link:** sits on the WHITE card, so its color = accent ONLY if accent has ≥3:1 contrast on white, else falls back to `#1a73e8`. (A white/pale accent made the link white-on-white — present in the DOM, invisible to the eye.)
- **Background color** (`backgroundColor`) drives the wrapper `bgWrap`; header-bar text + "Powered by" use `readableOn(bgWrap)` so they stay legible on any chosen background. Cards stay white (card text unaffected).
- Helpers in `widget.js`: `readableOn(hex)` (dark/light text for a bg) and the link contrast check. Mirror the same logic in the preview.

### Comment truncation + "Read more" modal
- Comment text is clamped with `-webkit-line-clamp:5`. **This requires all three together:** `display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:5` (+ `overflow:hidden`). Missing `display:-webkit-box` = no truncation. (Note: `getComputedStyle().display` may report `flow-root` even when `-webkit-box` is set and working — read the inline value / visual result, not the computed display, to judge it.)
- "Read more" is rendered as a **sibling AFTER** the clamped comment (not inside it — anything inside the clamp box gets clamped away). It is revealed based on **real overflow** (`scrollHeight - clientHeight > 2`), measured in `requestAnimationFrame` after layout, re-run per carousel page and on resize. Do NOT gate it on character count (the old `maxChars`/`hasLong` approach drifted out of sync with the visual clamp when fonts changed).
- Modal (`lrrOpenModal`, global): reads full review data from `data-*` attributes on the link, fills the modal, shows it. Comment is set via `textContent` (safe). **Avatar name is set via `innerHTML` unescaped → stored-XSS risk** (see Backlog). Card order: avatar/name/stars → date → comment → "Read more" (link is always last).

---

## Debugging Lessons (this session)

- **"Works on dev, not prod" with identical code is almost never a logic bug.** Check, in order: (1) did the Vercel production build actually deploy that commit and go green (deployments page shows the commit hash + "Ready"); (2) browser/CDN cache of `widget.js` or the page bundle (hard refresh / private window); (3) what DATA is actually on screen (sample vs real, which carousel page). Only after those, suspect code.
- **Verify rendering bugs by computed values, not by eye.** Eyes misled repeatedly this session: text that looked un-clamped was clamped; a "missing" Read more link was present but white-on-white. Read `getComputedStyle`, `scrollHeight`/`clientHeight`, and the element's actual `color`/position via the console before concluding anything.
- **A visible element you can't see is usually a color/position problem, not a missing element.** Confirm `display`/`visibility`/`opacity`/`color`/bounding-rect before assuming it didn't render.
- The dashboard Live Preview uses **sample data**, so it won't show a specific location's reviews — don't debug "the Dover reviews" via the preview.

---

## Backlog / Known Issues

- **Stored XSS in `public/widget.js`** (avatar render path, `lrrOpenModal`): reviewer name re-emitted into `innerHTML` unescaped. High severity, low likelihood today. Fix at the render boundary (HTML-escape the name, or build the avatar with DOM methods) before meaningful public traffic. See `LRR-Widget-XSS-Writeup.docx`.
- **Schema cleanup** (needs a `prisma db push` on both Neon branches): drop `Subscription`, `User.stripeCustomerId`, `isComped`, `compedAt`, `compedNote`, `notifyLowRated`, `notifyWeeklyDigest`, `password`.
- Vercel env var rotation (4-group plan) — delete + re-add with **Sensitive** toggle ON (the Edit button doesn't enable Sensitive storage). GitHub SSH key migration after rotation.
- Pre-launch test plan (`LRR-Pre-Launch-Test-Plan.docx`, 90 tests) — many Stripe/registration tests no longer apply; prune before reuse.
- Delete test accounts.
- Consider logging each alert send (e.g. a `NotificationLog` table) for visibility into delivery.

---

*Last updated: 2026-10-11 — Private-tool cleanup: Stripe, SendGrid, comps, registration and password login removed; Gmail SMTP alerts; `CRON_SECRET` fails closed.*
