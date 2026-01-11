# Nego - Managed Talent Marketplace

## Overview
Nego is a premium managed marketplace for elite escort services. The platform features a sophisticated dark-themed design with red accents (#df2531), custom typography (Playfair Display & DM Sans), and smooth animations.

## Tech Stack
- **Frontend**: Next.js 16.1.1 (App Router) + TypeScript + Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage)
- **UI Components**: Shadcn/UI + Radix UI
- **Icons**: Phosphor Icons
- **Fonts**: Playfair Display (headings), DM Sans (body)

## Deployment Status: ✅ READY

### Environment Variables (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=https://rmaqeotgpfvdtnvcfpox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Database Setup Required
1. Run `/app/frontend/supabase_schema.sql` in Supabase SQL Editor
2. (Optional) Run `/app/frontend/supabase_seed_talents.sql` for demo data

---

## Implemented Features

### Landing Page ✅
- Hero section with image slider and Ken Burns effect
- About section with bento grid layout
- Talent preview section
- Premium content section with locked images
- Footer with navigation

### Authentication ✅
- Login page (email + Google OAuth)
- Register page with role selection (Client/Talent)
- Supabase Auth integration
- Protected routes via middleware

### Client Dashboard ✅
- Dashboard home with stats
- Browse talents with filters (location, service type)
- Search functionality
- Sort by price/recent

### Talent Profile ✅
- Full profile view with avatar, bio, stats
- Service menu with pricing
- Gallery (premium/free content)
- Online/Offline/Booked status

### Booking Flow ✅
- Service selection with checkboxes
- Date and time picker
- Notes field
- Price calculation
- Booking confirmation modal
- Booking detail page with status tracking

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login page |
| `/register` | Register with role selection |
| `/dashboard` | Client dashboard home |
| `/dashboard/browse` | Browse all talents |
| `/talent/[id]` | Talent profile & booking |
| `/dashboard/bookings/[id]` | Booking details |

---

## Database Schema

### Core Tables
- `profiles` - User profiles (client/talent/admin)
- `wallets` - Coin balances
- `service_types` - Service categories
- `talent_menus` - Talent pricing per service
- `bookings` - Client-talent bookings
- `verifications` - Identity verification
- `media` - Talent photos/videos
- `user_unlocks` - Premium content unlocks
- `transactions` - Coin history

---

## Prioritized Backlog

### P0 - Immediate
- [x] Landing page migration
- [x] Authentication flow
- [x] Client dashboard
- [x] Browse talents
- [x] Talent profile
- [x] Booking flow
- [x] Deployment readiness

### P1 - High Priority
- [ ] Seed demo talent data
- [ ] Talent portal (profile management)
- [ ] Wallet & coin purchase
- [ ] Paystack payment integration
- [ ] Client verification gate

### P2 - Medium Priority
- [ ] Admin dashboard
- [ ] Booking management for talents
- [ ] Real-time notifications
- [ ] Chat/messaging

### P3 - Nice to Have
- [ ] Reviews/ratings
- [ ] Favorites list
- [ ] Search history
- [ ] Mobile optimization

---

## File Structure

```
/app/frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing
│   │   ├── login/page.tsx           # Login
│   │   ├── register/page.tsx        # Register
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Dashboard home
│   │   │   ├── browse/              # Browse talents
│   │   │   └── bookings/[id]/       # Booking detail
│   │   └── talent/[id]/             # Talent profile
│   ├── components/
│   │   ├── landing/                 # Landing sections
│   │   └── ui/                      # Shadcn components
│   ├── lib/
│   │   ├── supabase/                # Supabase clients
│   │   └── utils.ts
│   └── types/
│       └── database.ts
├── supabase_schema.sql              # Database schema
├── supabase_seed_talents.sql        # Demo data
├── .env                             # Production env
├── .env.local                       # Local env
└── package.json
```

---

## Notes

- **No FastAPI backend needed** - All backend functionality via Supabase
- **Row Level Security** enabled on all tables
- **Auto-trigger** creates profile + wallet on user signup
- **Service types** are admin-defined and seeded

---

*Last Updated: January 2026*
