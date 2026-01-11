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

### Supabase Configuration
- ✅ Database schema applied
- ✅ Demo talents seeded (6 profiles)
- ✅ Email confirmation DISABLED
- ✅ handle_new_user() trigger working

---

## ✅ E2E Test Results (January 2026)

**Success Rate: 100% (Core Features)**

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | ✅ | Client role, auto-creates profile + 100 coins |
| Auto-login | ✅ | Redirects to dashboard after signup |
| Dashboard | ✅ | Shows coins balance, featured talents |
| Browse Talents | ✅ | 6 talents with filters, search |
| Talent Profile | ✅ | Profile info, 4 services, gallery |
| Service Selection | ✅ | Select services, shows total |
| Booking Modal | ✅ | Date/time picker, wallet balance |
| Booking Creation | ✅ | Creates booking, redirects to detail |
| Booking Detail | ✅ | Shows status, services, pay button |

---

## Implemented Features

### Landing Page ✅
- Global AppHeader (auth-aware, responsive)
- Hero section with 5-image slider and Ken Burns effect
- About section with flexible bento grid layout
- Talent preview section (6 talents from DB)
- Premium content section with locked images
- Footer with navigation and legal links

### Legal Pages ✅
- Terms & Conditions (/terms)
- Privacy Policy (/privacy)
- Cookie Policy (/cookies)

### Authentication ✅
- Login page (email + Google OAuth ready)
- Register page with role selection (Client/Talent)
- Supabase Auth integration
- Auto-login after registration
- Protected routes via middleware

### Client Dashboard ✅
- Dashboard home with coin balance (100 starting coins)
- Browse talents with filters (location, service type)
- Search functionality
- Sort by price/recent

### Talent Profile ✅
- Full profile view with avatar, bio, stats
- Service menu with pricing (4 services per talent)
- Gallery (premium/free content)
- Online/Offline/Booked status
- Verified badge

### Booking Flow ✅
- Service selection with checkboxes
- Running total calculation
- Date and time picker
- Notes field (optional)
- Booking confirmation modal
- Wallet balance display
- Booking detail page with payment status

### Wallet Page ✅
- Beautiful gradient balance card (coins display)
- 4 coin packages (₦5,000 - ₦35,000)
- Bonus coins on larger packages
- Transaction history with icons
- "How to earn/spend" info cards
- Paystack integration ready (awaiting API keys)

### Talent Dashboard ✅
- Profile overview with stats (earnings, bookings)
- Bio editing functionality
- Services management (add/remove/toggle visibility)
- Gallery tab for media management
- Recent bookings list with status
- Quick tips for better profile

---

## Routes

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Landing page |
| `/login` | ✅ | Login page |
| `/register` | ✅ | Register with role selection |
| `/dashboard` | ✅ | Client dashboard home |
| `/dashboard/browse` | ✅ | Browse all talents |
| `/dashboard/bookings/[id]` | ✅ | Booking details |
| `/talent/[id]` | ✅ | Talent profile & booking |
| `/dashboard/profile` | ✅ | Profile with stats, edit functionality |
| `/dashboard/wallet` | ✅ | Wallet with balance, packages, transactions |
| `/dashboard/talent` | ✅ | Talent dashboard (services, gallery, bookings) |
| `/dashboard/favorites` | ✅ | Favorites list with localStorage persistence |
| `/dashboard/settings` | ✅ | Account, notifications, privacy settings |
| `/terms` | ✅ | Terms & Conditions |
| `/privacy` | ✅ | Privacy Policy |
| `/cookies` | ✅ | Cookie Policy |

---

## Database Schema

### Core Tables
- `profiles` - User profiles (client/talent/admin)
- `wallets` - Coin balances (100 starting coins)
- `service_types` - 5 service categories
- `talent_menus` - Talent pricing per service (21 entries)
- `bookings` - Client-talent bookings
- `verifications` - Identity verification
- `media` - Talent photos/videos (14 entries)
- `user_unlocks` - Premium content unlocks
- `transactions` - Coin history

### Demo Data
- **6 Talents**: Adaeze (Lagos), Chidinma (Abuja), Folake (Port Harcourt), Grace (Lagos), Halima (Kano), Ify (Enugu)
- **5 Service Types**: Dinner Date, Event Companion, Travel Companion, Private Meeting, Photo Session
- **Prices**: ₦100,000 - ₦800,000 per service

---

## Test Credentials

```
Email: e2etest_1768159919@nego.com
Password: TestPass123!
```

---

## Prioritized Backlog

### P0 - Completed ✅
- [x] Landing page migration
- [x] Authentication flow
- [x] Client dashboard
- [x] Browse talents with filters
- [x] Talent profile
- [x] Booking flow
- [x] E2E testing passed

### P1 - High Priority
- [x] Wallet page (view balance, packages, transactions)
- [x] Talent dashboard (services, gallery, bookings management)
- [ ] Favorites list
- [ ] User profile page
- [ ] Paystack payment integration (waiting for API keys)
- [ ] Client verification gate

### P2 - Medium Priority
- [ ] Talent portal (profile management)
- [ ] Booking management for talents
- [ ] Admin dashboard
- [x] Terms & Privacy pages (Completed Jan 2026)

### P3 - Nice to Have
- [ ] Real-time notifications
- [ ] Chat/messaging
- [ ] Reviews/ratings
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
│   │   │   ├── DashboardClient.tsx
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
├── supabase_seed_talents.sql        # Demo talent data
├── supabase_fix_trigger.sql         # Trigger fix
├── .env                             # Production env
└── package.json
```

---

## SQL Files Reference

| File | Purpose |
|------|---------|
| `supabase_schema.sql` | Initial database schema |
| `supabase_seed_talents.sql` | 6 demo talents + services |
| `supabase_fix_trigger.sql` | Fixed handle_new_user() trigger |

---

*Last Updated: January 2026*
*E2E Test: PASSED ✅*
