# LRR Ops Notes

A running notebook of workflows, gotchas, and how-tos for managing Local Review Responder.

---

## Comping a User

### What "comped" means
A comped user has `isComped = true` in the database. This flag:
- Skips Stripe entirely when they add locations (server-side guard in `/api/stripe/checkout`)
- Prevents the `customer.subscription.deleted` webhook from deactivating their locations
- Is included in the JWT and session so it's available everywhere in the app

### Scenario 1 — New user who should never hit Stripe

1. User signs up (Google OAuth)
2. **You comp them first** via the Admin dashboard → User Management → Grant Comp
3. User goes through onboarding and adds locations → Stripe is skipped automatically

> ⚠️ Order matters: comp BEFORE they add locations. If locations are added first, Stripe trials are already created.

---

### Scenario 2 — Existing user who already has locations (retroactive comp)

1. Comp them via Admin dashboard → User Management → Grant Comp
2. Go to Stripe dashboard and **manually cancel** their active trials/subscriptions
3. Stripe will fire a `customer.subscription.deleted` webhook — the webhook handler checks `isComped` before taking any action, so their locations will NOT be deactivated

> ⚠️ Always cancel Stripe subs after comping, not before — the isComped guard needs to be in place first.

---

### Scenario 3 — Admin account accidentally created Stripe trials (recovery)

This happened on 3/30/2026 when locations were added to `admin@localreviewresponder.com` before comping was in place.

Steps taken to recover:
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
| `isComped` UI redirect | `src/app/onboarding/page.tsx` | Redirects comped users to dashboard, skipping onboarding entirely |
| `isComped` Stripe checkout guard | `src/app/api/stripe/checkout/route.ts` | Returns 403 if user is comped — Stripe never called |
| `isComped` webhook guard | Stripe webhook handler | Prevents `subscription.deleted` from deactivating comped user locations |
| `isAdmin`/`isComped` onboarding redirect guard | `src/app/onboarding/page.tsx` | Prevents privileged users from being redirected to onboarding post-login |

---

## Admin Dashboard

URL: `app.localreviewresponder.com/admin`

| Action | Notes |
|---|---|
| Grant Comp | Sets `isComped = true` on user. Do this BEFORE user adds locations. |
| Revoke Comp | Sets `isComped = false`. User will need active Stripe sub to retain access. |
| Delete user | Cannot delete admin account (Protected) |

---

## Neon DB — Useful Queries

```sql
-- Check locations for a user
SELECT * FROM "Location"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'user@example.com');

-- Delete all locations for a user
DELETE FROM "Location"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'user@example.com');

-- Check comp status for all users
SELECT email, "isComped", "isAdmin" FROM "User";
```

---

## Stripe

- **Live mode** active on production
- **Test mode** on preview (dev branch)
- Test card: `4242 4242 4242 4242`
- Always cancel trials in Stripe dashboard after deleting locations from DB
- Active subscriptions charge immediately if not cancelled — cancel those first

---

*Last updated: 2026-03-30*