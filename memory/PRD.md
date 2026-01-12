# Nego - Managed Talent Marketplace

## Overview
Nego is a premium managed talent marketplace built with Next.js 14, Supabase, and PostgreSQL. It connects discerning clients with verified, elite talent through a modern, dark-themed platform.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Phosphor Icons
- **Fonts**: Playfair Display, DM Sans, Cinzel Decorative

## Core Features

### Implemented ✅
1. **Landing Page**
   - Hero section with image carousel
   - About Us bento grid
   - Talent showcase
   - Premium content section
   - Footer with legal links

2. **Authentication**
   - Email/password registration with role selection (Client/Talent)
   - Login functionality
   - Session management via Supabase Auth
   - Google OAuth placeholder

3. **Client Dashboard**
   - Home: Overview with welcome, stats, real featured talents from DB
   - Browse: Search and filter talents
   - Favorites: Save and manage favorite talents
   - Bookings: View and manage bookings
   - Wallet: View balance, purchase coins
   - Profile: View/edit profile
   - Settings: Account settings

4. **Talent Dashboard**
   - Profile management
   - Service menu management
   - Media gallery management
   - Booking management
   - Earnings overview

5. **Booking Flow**
   - Service selection from talent profile
   - Low balance warning
   - Coin deduction on booking
   - Verification gate redirect

6. **Verification Flow** ✅
   - Selfie upload to Supabase Storage (verifications bucket)
   - Phone number collection
   - GPS coordinates (optional)
   - 4-step flow: intro, selfie, details, complete

7. **Legal Pages**
   - Terms of Service
   - Privacy Policy
   - Cookie Policy

### Known Issues ⚠️
1. **Talent Role Registration**: Users registering as "talent" may be assigned "client" role due to Supabase trigger. Run `/app/frontend/supabase_fix_trigger_v2.sql` to fix.

### Upcoming Tasks
1. **Paystack Integration** - Allow users to purchase coins with real money
2. **Google OAuth** - Add Google sign-in option
3. **Admin Panel** - Verification and user management
4. **Real-time Features** - Chat and notifications
5. **Reviews & Ratings** - Post-booking reviews

## Database Schema
- `profiles`: User profiles (role, display_name, bio, etc.)
- `wallets`: User coin balances
- `transactions`: Coin transaction history
- `bookings`: Booking records
- `verifications`: Client verification data (selfie_url stored in Supabase Storage)
- `talent_menus`: Talent service offerings
- `service_types`: Available service categories
- `media`: Talent media files
- `favorites`: Client saved talents

## Supabase Storage Buckets
- `verifications`: Private bucket for client selfie uploads (RLS enabled)

## Key Files
- `/app/frontend/src/app/dashboard/DashboardClient.tsx` - Main dashboard layout
- `/app/frontend/src/app/dashboard/verify/VerifyClient.tsx` - Verification flow
- `/app/frontend/src/app/talent/[id]/TalentProfileClient.tsx` - Talent profile with booking
- `/app/frontend/src/app/register/page.tsx` - Registration with role selection

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---
*Last Updated: January 2026*
*Verification Flow: WORKING ✅*
*Storage Bucket: CONFIGURED ✅*
