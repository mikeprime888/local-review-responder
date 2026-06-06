<!-- ========================================================================
     ORIENTATION FOR A NEW CLAUDE CODE SESSION
     Read this block in full before reading any other file or making any change.
     A fresh Claude Code session has no memory of prior work — these are the
     non-obvious rules that prevent errors. Re-read if unsure.
     ======================================================================== -->

# Claude Code — Session Orientation

## What this repo is
**Local Review Responder (LRR)** — a SaaS app that helps local businesses manage and respond to Google Business Profile (GBP) reviews, and embed a review widget on their sites.
Stack: **Next.js 14 (App Router, TypeScript)**, Prisma ORM, Neon PostgreSQL, NextAuth.js (Google OAuth), Stripe, Tailwind CSS, Vercel hosting, OpenAI GPT-4o-mini, SendGrid, GBP + Google Places APIs.

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

## Entitlement model (see Comping section below for detail)
- **`isActive` is the unified access signal.** Gating on `subscription` presence instead of `isActive` is the root cause of the recurring comped-user display bugs.
- **`isComped` ≠ `isAdmin`** — comp is an explicit audited grant, not implied by admin role.
- GBP location sync uses `listAccounts()` + `listLocations(accountId)` per account — **not** the `accounts/-/locations` wildcard (it misses `LOCATION_GROUP` account types).

<!-- ===================== END ORIENTATION ===================== -->

---

# LRR Ops Notes

A running notebook of workflows, gotchas, and how-tos for managing Local Review Responder.

---

## Comping a User

### What "comped" means
A comped user has `isComped = true` in the database. This flag:
- Skips Stripe entirely when they add locations (server-side guard in `/api/stripe/checkout`)
- Prevents the `customer.subscription.deleted` webhook from deactivating their locations
- Is included in the JWT and session so it's available everywhere in the app

> `isComped` must be explicitly threaded through the NextAuth JWT and session callbacks — it exists in the Prisma schema but is not automatic in the session types.

### Scenario 1 — New user who should never hit Stripe
1. User signs up (Google OAuth)
2. **You comp them first** via the Admin dashboard → User Management → Grant Comp
3. User goes through onboarding and adds locations → Stripe is skipped automatically

> ⚠️ Order matters: comp BEFORE they add locations. If locations are added first, Stripe trials are already created.

### Scenario 2 — Existing user who already has locations (retroactive comp)
1. Comp them via Admin dashboard → User Management → Grant Comp
2. Go to Stripe dashboard and **manually cancel** their active trials/subscriptions
3. Stripe fires a `customer.subscription.deleted` webhook — the handler checks `isComped` before acting, so their locations will NOT be deactivated

> ⚠️ Always cancel Stripe subs after comping, not before — the `isComped` guard needs to be in place first.
> 📌 Backlog: build auto Stripe cancellation into the Grant Comp admin action so this manual step isn't needed for existing paying users.

### Scenario 3 — Admin account accidentally created Stripe trials (recovery)
This happened on 3/30/2026 when locations were added to `admin@localreviewresponder.com` before comping was in place.
1. Cancelled all 4 Stripe subscriptions manually in Stripe dashboard (Active ones first)
2. Deleted location records from Neon production DB:
   ```sql
   DELETE FROM "Location"
   WHERE "userId" = (SELECT id FROM "User" WHERE email = 'admin@localreviewresponder.com');
   ```
3. Verified 0 rows returned on SELECT

---

## Key Guards & Safety Rules

| Guard | Location | What it does |
|---|---|---|
| `isComped` UI redirect | `src/app/onboarding/page.tsx` | Redirects comped users to dashboard, skipping onboarding |
| `isComped` Stripe checkout guard | `src/app/api/stripe/checkout/route.ts` | Returns 403 if user is comped — Stripe never called |
| `isComped` webhook guard | `src/app/api/stripe/webhook/route.ts` (~line 173) | Prevents `subscription.deleted` from deactivating comped locations. **Verified end-to-end 2026-04-29** (test mode + dev preview): sub canceled, `Location.isActive` stayed `true`, log line `"Webhook: Skipping deactivation for comped user <userId>"` fired |
| Onboarding "already set up" redirect | `src/app/onboarding/page.tsx` | The redirect signal is `locations?.length > 0` ONLY. Do NOT OR `isAdmin`/`isComped` into this condition, or comped users can never complete onboarding |

**Entitlement principles**
- `isActive` is the unified access signal (set by both the Stripe webhook and the `/api/locations/activate` comped route). Gate on `isActive`, not on `subscription` presence — the latter is the root cause of the recurring comped-user display bugs.
- `isComped` ≠ `isAdmin`. Comp is an explicit audited grant; admin role does not confer it for billing.

---

## Admin Dashboard

URL: `app.localreviewresponder.com/admin`

| Action | Notes |
|---|---|
| Grant Comp | Sets `isComped = true`. Do this BEFORE the user adds locations. |
| Revoke Comp | Sets `isComped = false`. User then needs an active Stripe sub to retain access. |
| Delete user | Cannot delete admin account (protected) |

---

## Neon DB

### Branches
- **Production:** `ep-young-haze`
- **Preview:** `ep-misty-bar` (schema-only, no auto-delete; used by the dev preview build)
- SQL editor branch selector: navigate to the branch in the sidebar FIRST, then open the SQL Editor.

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

-- Check comp status for all users
SELECT email, "isComped", "isAdmin", "isActive" FROM "User";
```

---

## Stripe
- **Live mode** active on production
- **Test mode** on preview (dev branch)
- Test card: `4242 4242 4242 4242`
- Webhook: `app.localreviewresponder.com/api/stripe/webhook` (dev test webhook at the preview URL)
- Always cancel trials in Stripe dashboard after deleting locations from DB
- Active subscriptions charge immediately if not cancelled — cancel those first

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
- Auto Stripe cancellation in the Grant Comp admin action (for comping existing paying users).
- Vercel env var rotation (4-group plan) — delete + re-add with **Sensitive** toggle ON (the Edit button doesn't enable Sensitive storage). GitHub SSH key migration after rotation.
- Verify/wire or drop unused `User.notifyNewReviews` column.
- Improve `sendEmail` error visibility: log full SendGrid response bodies on non-2xx; consider a `NotificationLog` table.
- Clean up `/api/places/search` route if no UI callers confirmed (Places API key already restricted to Places API only).
- Pre-launch test plan (`LRR-Pre-Launch-Test-Plan.docx`, 90 tests) — completion status to confirm; Stripe is in live mode.
- Delete test accounts; remove `/api/test-email` endpoint.

---

*Last updated: 2026-06-04 — Added Claude Code session-orientation block; refreshed entitlement/webhook guards (isActive, verified webhook guard); added Review Widget architecture, color/contrast rules, truncation/modal notes, debugging lessons, and backlog (incl. widget XSS).*
