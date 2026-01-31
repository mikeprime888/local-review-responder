# Local Review Responder

A SaaS reputation management application that integrates with Google Business Profile API to help businesses fetch and respond to customer reviews.

## Features (Stage 1)

✅ Google OAuth Authentication  
✅ Database Schema (PostgreSQL via Neon)  
✅ Basic Dashboard UI  
✅ Session Management  

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Neon (PostgreSQL) via Prisma ORM
- **Authentication:** NextAuth.js with Google OAuth
- **Hosting:** Vercel

## Prerequisites

Before you begin, you'll need:

1. **GitHub Account** - To store your code
2. **Vercel Account** - To host the application
3. **Neon Account** - For the PostgreSQL database
4. **Google Cloud Console** - OAuth credentials configured

## Setup Instructions

### Step 1: Clone and Install

```bash
# If you have the ZIP file, extract it first
# Then navigate to the project directory
cd local-review-responder

# Install dependencies
npm install
```

### Step 2: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:pass@host/db?sslmode=require`)

### Step 3: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Create or update your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://YOUR-APP.vercel.app/api/auth/callback/google` (for production)
   - `https://localreviewresponder.com/api/auth/callback/google` (your domain)
5. Copy the **Client ID** and **Client Secret**

### Step 4: Create Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Database
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-32-character-string"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 5: Initialize Database

```bash
# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### Step 6: Run Locally (Optional)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Stage 1"
git remote add origin https://github.com/YOUR-USERNAME/local-review-responder.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Add Environment Variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (set to your Vercel URL, e.g., `https://local-review-responder.vercel.app`)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
5. Click "Deploy"

### Step 3: Update Google OAuth

After deployment, add your Vercel URL to Google OAuth redirect URIs:
```
https://YOUR-APP.vercel.app/api/auth/callback/google
```

## Project Structure

```
local-review-responder/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── app/
│   │   ├── api/auth/        # NextAuth API route
│   │   ├── dashboard/       # Dashboard page
│   │   ├── login/           # Login page
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   └── dashboard/       # Dashboard components
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── prisma.ts        # Prisma client
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── next-auth.d.ts   # TypeScript declarations
├── .env.example             # Environment template
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Stage 1 Test Checklist

After deploying, verify:

- [ ] Landing page loads correctly
- [ ] "Sign In" button redirects to login page
- [ ] Google OAuth login works
- [ ] After login, redirects to dashboard
- [ ] Dashboard shows user name and email
- [ ] Sign out works

## Next Stages

**Stage 2:** Google Business Profile Integration
- Connect locations
- Fetch reviews
- Display reviews in dashboard

**Stage 3:** Reply & Notifications
- Reply to reviews
- SendGrid email setup
- New review notifications

**Stage 4:** Polish & Features
- Multi-location support
- Analytics dashboard
- Filters, search, pagination

## Troubleshooting

### "Invalid redirect_uri" error
- Make sure you added the correct redirect URI in Google Cloud Console
- Check that NEXTAUTH_URL matches your actual URL

### Database connection failed
- Verify DATABASE_URL is correct
- Make sure you're using `?sslmode=require` at the end

### "NEXTAUTH_SECRET is not set" error
- Generate a secret: `openssl rand -base64 32`
- Add it to your environment variables

## Support

If you encounter issues, check:
1. Environment variables are set correctly
2. Google OAuth is configured with correct redirect URIs
3. Database connection string is valid
4. All dependencies are installed (`npm install`)

---

Built with ❤️ using Next.js, Prisma, and Tailwind CSS
