# Review Widget Feature

This document describes the review widget feature that allows business owners to display curated reviews on their own websites.

## Overview

The widget feature enables users to:
- Publish/unpublish individual reviews
- Feature important reviews (shown first)
- Configure widget appearance (theme, layout, colors)
- Embed a responsive widget on any website
- Auto-publish reviews based on star rating

## Database Changes

### Updated Review Model
Added fields to the existing `Review` model:
- `isPublished` (Boolean) - Whether the review is visible on the widget
- `publishedAt` (DateTime?) - When the review was published
- `isFeatured` (Boolean) - Whether the review is featured/pinned

### New WidgetSettings Model
Stores per-location widget configuration:
- Layout options: `list`, `grid`, `carousel`
- Theme options: `light`, `dark`, `auto`
- Accent color (hex)
- Max reviews to display
- Minimum star filter
- Auto-publish settings
- Display toggles (date, name, photo, rating, reply, summary, badge)
- Google review link for CTA button

## API Endpoints

### Public (No Auth Required)
- `GET /api/widget/[locationId]` - Returns published reviews and settings for widget embedding

### Protected (Auth Required)
- `PATCH /api/reviews/[reviewId]/publish` - Toggle publish/feature status for a review
- `POST /api/reviews/bulk-publish` - Bulk publish/unpublish operations
- `GET /api/widget-settings/[locationId]` - Get widget settings and embed codes
- `PUT /api/widget-settings/[locationId]` - Update widget settings
- `GET /api/locations/[locationId]/reviews` - Get all reviews with publish status

## Files Created

### Backend
- `prisma/schema.prisma` - Updated schema with new fields and model
- `src/app/api/widget/[locationId]/route.ts` - Public widget API
- `src/app/api/reviews/[reviewId]/publish/route.ts` - Publish toggle API
- `src/app/api/reviews/bulk-publish/route.ts` - Bulk actions API
- `src/app/api/widget-settings/[locationId]/route.ts` - Widget settings API
- `src/app/api/locations/[locationId]/reviews/route.ts` - Reviews list API
- `src/middleware.ts` - CORS middleware for widget endpoints

### Frontend
- `src/app/dashboard/widget/page.tsx` - Widget settings dashboard page
- `src/app/dashboard/reviews/page.tsx` - Reviews management page
- `src/components/dashboard/ReviewCard.tsx` - Review card with publish toggle
- `src/app/embed/[locationId]/page.tsx` - Server-rendered embed page for iframes
- `src/app/embed/[locationId]/layout.tsx` - Minimal layout for embed

### Widget
- `public/widget.js` - Embeddable JavaScript widget

### Types
- `src/types/widget.ts` - TypeScript definitions

## Embedding the Widget

### JavaScript Embed (Recommended)
```html
<div id="lrr-reviews" data-location="YOUR_LOCATION_ID"></div>
<script src="https://your-domain.com/widget.js" async></script>
```

### iFrame Embed (Alternative)
```html
<iframe 
  src="https://your-domain.com/embed/YOUR_LOCATION_ID" 
  width="100%" 
  height="600" 
  frameborder="0">
</iframe>
```

## Deployment Steps

1. Run Prisma migration:
   ```bash
   npx prisma migrate dev --name add-widget-features
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Deploy to Vercel:
   ```bash
   git add .
   git commit -m "Add review widget feature"
   git push
   ```

## Future Enhancements

- [ ] Carousel layout implementation in widget.js
- [ ] Manual reviews (non-Google reviews)
- [ ] Social proof notifications (toast popups)
- [ ] Widget analytics (impressions, clicks)
- [ ] SEO structured data (JSON-LD)
- [ ] Multiple embed themes/presets
- [ ] Custom CSS injection for advanced users
