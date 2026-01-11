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
   - Home: Overview with welcome, stats, recent bookings
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

6. **Legal Pages**
   - Terms of Service
   - Privacy Policy
   - Cookie Policy

### Pending Issues ⚠️
1. **Talent Role Registration Bug**: New users registering as "talent" are not properly assigned the talent role. 
   - **Root Cause**: Supabase trigger defaults role to 'client'
   - **Fix Required**: User must run `/app/frontend/supabase_fix_trigger_v2.sql` in Supabase SQL Editor

2. **Verification File Upload**: Requires user to create `verifications` storage bucket in Supabase

3. **Service Prices**: ✅ FIXED - Now displays "coins" instead of "NGN"

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
- `verifications`: Client verification data
- `talent_menus`: Talent service offerings
- `service_types`: Available service categories
- `media`: Talent media files
- `favorites`: Client saved talents

## Key Files
- `/app/frontend/src/app/dashboard/DashboardClient.tsx` - Main dashboard layout
- `/app/frontend/src/app/talent/[id]/TalentProfileClient.tsx` - Talent profile with booking
- `/app/frontend/src/app/register/page.tsx` - Registration with role selection
- `/app/frontend/supabase_fix_trigger_v2.sql` - SQL fix for role assignment

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---
*Last Updated: January 2026*
