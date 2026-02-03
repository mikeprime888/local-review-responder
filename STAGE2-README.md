# Stage 2: Google Business Profile Integration

## What's New

Stage 2 connects your app to Google's Business Profile APIs to fetch real locations and reviews.

### New Files
```
src/lib/google-business.ts      - GBP API utility (accounts, locations, reviews)
src/lib/auth.ts                  - UPDATED: Added GBP scope + token management
src/app/api/google/accounts/     - API route: list GBP accounts
src/app/api/google/locations/    - API route: list/sync locations
src/app/api/google/reviews/      - API route: list/sync reviews
src/app/api/google/reviews/reply - API route: post/delete review replies
src/app/dashboard/page.tsx       - UPDATED: Real data dashboard
src/components/dashboard/StatsBar.tsx     - Review stats component
src/components/dashboard/LocationList.tsx - Location sidebar
src/components/dashboard/ReviewList.tsx   - Review list with reply
src/components/dashboard/SyncButton.tsx   - Sync dropdown button
prisma/schema.prisma             - UPDATED: Added Location + Review models
src/types/next-auth.d.ts         - UPDATED: Session types
```

### API Endpoints (Important!)

The GBP API uses THREE different base URLs (this is what caused issues before):

| API | Base URL | Used For |
|-----|----------|----------|
| Account Management | `mybusinessaccountmanagement.googleapis.com/v1` | List accounts |
| Business Information | `mybusinessbusinessinformation.googleapis.com/v1` | List locations |
| My Business (v4) | `mybusiness.googleapis.com/v4` | Reviews & replies |

## Deployment Steps

### Step 1: Copy Files into Your Project

On your Mac, extract the zip and copy files over:

```bash
cd ~/Desktop
unzip stage2-gbp-integration.zip -d stage2-files

# Copy files into your project (preserving directory structure)
cp -r stage2-files/ ~/Desktop/local-review-responder/
```

### Step 2: Run Prisma DB Push (creates new tables)

```bash
cd ~/Desktop/local-review-responder
npm install
npx prisma db push
```

This creates the `Location` and `Review` tables in your Neon database.

### Step 3: IMPORTANT - Re-authenticate

Because we added the `business.manage` scope, existing users need to sign out 
and sign back in to grant the new permission.

The auth config now includes `prompt: 'consent'` which forces Google to show 
the consent screen again, ensuring users grant the GBP API permission.

### Step 4: Push to GitHub & Redeploy

```bash
cd ~/Desktop/local-review-responder
git add .
git commit -m "Stage 2: Google Business Profile integration"
git push
```

Vercel will auto-deploy from GitHub.

### Step 5: Test

1. Go to your Vercel app URL
2. Sign out (if already signed in)
3. Sign in again - you should see a consent screen asking for "Manage your Google Business Profile" permission
4. Accept the permissions
5. On the dashboard, click "Sync" → "Sync All"
6. Your locations and reviews should appear!

## Required Google Cloud APIs

Make sure these are enabled in project `gbp-24388`:

- My Business Account Management API
- My Business Business Information API  
- Google My Business API (for reviews)

Enable at: https://console.cloud.google.com/apis/library?project=gbp-24388

## Troubleshooting

### "Permission denied" error
- Sign out and sign back in to grant the `business.manage` scope
- Check that the APIs are enabled in Google Cloud Console

### "No accounts found"
- The Google account you sign in with must be an owner/manager of GBP locations
- Check your GBP access at: https://business.google.com

### Reviews not showing
- Reviews API requires verified locations
- Sync locations first, then sync reviews

### Token expired errors
- The app auto-refreshes tokens, but if it fails, sign out and sign back in
