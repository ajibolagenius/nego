# Nego - Managed Talent Marketplace

## Overview
Nego is a premium managed marketplace for elite escort services. The platform features a sophisticated dark-themed design with red accents, custom typography (Playfair Display & DM Sans), and smooth animations.

## Tech Stack (Migrated January 2026)
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage)
- **UI Components**: Shadcn/UI + Radix UI
- **Icons**: Phosphor Icons
- **Fonts**: Playfair Display (headings), DM Sans (body)

## Current Status

### ✅ Completed (Phase 1 - Migration)
- Next.js 14 project setup with App Router
- Supabase integration configured
- Landing page components ported:
  - Header with navigation
  - Hero section with image slider
  - About section with bento grid
  - Talent section with grid
  - Premium content section
  - Footer
- Authentication pages:
  - Login page (email + Google OAuth)
  - Register page with role selection (Client/Talent)
  - Auth callback handler
- Basic dashboard structure
- Database schema designed (see `/app/frontend/supabase_schema.sql`)

### 🔴 Pending - Database Setup Required
**User must run the SQL schema in Supabase:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `/app/frontend/supabase_schema.sql`
3. Run the query to create all tables

### 🟡 In Progress / Next Steps
1. **Run database schema** in Supabase
2. **Enable Google OAuth** in Supabase (optional)
3. **Client Dashboard**:
   - Browse talents with filters
   - Talent profile view
   - Booking flow
   - Wallet & coin purchase
4. **Talent Portal**:
   - Profile management
   - Service menu setup
   - Media uploads
   - Booking management

---

## Database Schema Summary

### Core Tables
- `profiles` - User profiles (extends auth.users)
- `wallets` - Coin balances per user
- `service_types` - Admin-defined service categories
- `talent_menus` - Talent prices per service
- `bookings` - Client-talent bookings
- `verifications` - Client identity verification per booking
- `media` - Talent photos/videos
- `user_unlocks` - Premium content unlocks
- `transactions` - Coin transaction history

### User Roles
- `client` - Browse and book talent
- `talent` - Provide services, manage profile
- `admin` - Platform management

---

## File Structure

```
/app/frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles
│   │   ├── login/page.tsx    # Login page
│   │   ├── register/page.tsx # Register page
│   │   ├── auth/callback/    # OAuth callback
│   │   └── dashboard/        # User dashboard
│   ├── components/
│   │   ├── landing/          # Landing page sections
│   │   └── ui/               # Shadcn components
│   ├── lib/
│   │   ├── supabase/         # Supabase client setup
│   │   └── utils.ts          # Helper functions
│   └── types/
│       └── database.ts       # TypeScript types
├── supabase_schema.sql       # Database schema
├── next.config.ts
├── package.json
└── .env.local                # Supabase credentials
```

---

## Environment Variables

```env
# /app/frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://rmaqeotgpfvdtnvcfpox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Prioritized Backlog

### P0 (Critical - Immediate)
- [ ] Run database schema in Supabase
- [ ] Test authentication flow
- [ ] Complete client dashboard with talent browsing

### P1 (High Priority)
- [ ] Talent portal (profile, services, media)
- [ ] Booking flow with payment
- [ ] Wallet system with coin purchase
- [ ] Client verification gate

### P2 (Medium Priority)
- [ ] Admin dashboard
- [ ] Payment integration (Paystack)
- [ ] Media uploads to Supabase Storage
- [ ] Search and filter talents

### P3 (Nice to Have)
- [ ] Real-time chat
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

## Design System
See `/app/frontend_backup/src/DESIGN_SYSTEM.md` for colors, typography, and component patterns.

**Primary Color**: #df2531 (Red)
**Fonts**: Playfair Display (headings), DM Sans (body)
**Theme**: Dark mode only
