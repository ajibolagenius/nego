# Nego - Managed Talent Marketplace

## Product Requirements Document (PRD)

### Overview
Nego is a managed talent marketplace connecting service providers (Talent) with clients (Members). It emphasizes a secure, managed environment with a unique post-payment verification gate for client identity.

---

## Tech Stack

### Documented (Target)
- **Frontend**: Next.js 14 (App Router), Shadcn/UI + Tailwind CSS
- **Backend**: Supabase (Auth, Database, API, Edge Functions)
- **Database**: PostgreSQL (Supabase)
- **Media Storage**: Cloudinary
- **Payments**: Paystack (react-paystack)
- **Webcam**: react-webcam
- **Hosting**: Vercel
- **Security**: Cloudflare

### Current Implementation
- **Frontend**: Next.js 14 (App Router), Shadcn/UI + Tailwind CSS ✅
- **Backend**: Supabase (Auth, Database) ✅
- **Database**: PostgreSQL (Supabase) ✅
- **Media Storage**: Supabase Storage ⚠️ (Using Supabase instead of Cloudinary)
- **Payments**: NOT IMPLEMENTED ❌
- **Webcam**: NOT IMPLEMENTED ❌ (Using file upload instead)
- **Hosting**: Emergent Platform (Preview) ⚠️

---

## Route Structure Comparison

### Documented Routes (Routes.md)

```
(auth)/
├── login/               
├── register/            

(client)/
├── dashboard/           # Feed (Home)
├── talent/[id]/         # Talent Profile + Booking
├── wallet/              # Buy Coins (Paystack)
├── bookings/            # List of bookings
└── bookings/[id]/verify/ # SECURITY GATE (Webcam)

(talent)/
├── portal/              # Dashboard Home
├── portal/menu/         # Service Pricing
├── portal/media/        # Upload Media
└── portal/requests/     # Accept/Reject Bookings

(admin)/
├── admin/verifications/ # Review Selfies
└── admin/payouts/       # Manual Bank Transfers

api/
├── webhooks/paystack/   # Paystack Webhook
└── cron/                # Auto-expire bookings
```

### Current Implementation

```
(auth)/ - EMPTY ROUTE GROUPS ⚠️
(client)/ - EMPTY ROUTE GROUPS ⚠️
(talent)/ - EMPTY ROUTE GROUPS ⚠️
(admin)/ - EMPTY ROUTE GROUPS ⚠️

login/                   ✅ Implemented
register/                ✅ Implemented

dashboard/               ✅ Implemented (Client Home/Feed)
dashboard/browse/        ✅ Implemented (Talent browsing)
dashboard/bookings/      ✅ Implemented (Booking list)
dashboard/bookings/[id]/ ✅ Implemented (Booking detail)
dashboard/verify/        ✅ Implemented (Verification - File upload, not webcam)
dashboard/wallet/        ⚠️ UI Only (No Paystack integration)
dashboard/favorites/     ✅ Implemented
dashboard/profile/       ✅ Implemented
dashboard/settings/      ✅ Implemented
dashboard/talent/        ✅ Implemented (Talent Dashboard)

talent/[id]/             ✅ Implemented (Talent Profile + Booking)

auth/callback/           ✅ Implemented (OAuth callback)

terms/                   ✅ Implemented
privacy/                 ✅ Implemented
cookies/                 ✅ Implemented

api/                     ❌ NOT IMPLEMENTED
admin/                   ❌ NOT IMPLEMENTED
```

---

## Feature Implementation Status

### 1. Authentication
| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password Login | ✅ Done | Working |
| Email/Password Register | ✅ Done | Working |
| Google OAuth | ⚠️ Partial | Button exists, may need Supabase config |
| Role Selection (Client/Talent) | ⚠️ Buggy | Trigger doesn't read metadata correctly |

### 2. Client Features
| Feature | Status | Notes |
|---------|--------|-------|
| Talent Feed/Browse | ✅ Done | Grid with filters |
| Talent Profile View | ✅ Done | Services, gallery, booking |
| Service Selection | ✅ Done | Checkbox selection |
| Booking Creation | ✅ Done | Creates booking, deducts coins |
| Wallet UI | ✅ Done | Shows balance, packages |
| Coin Purchase (Paystack) | ❌ Missing | UI exists, no payment integration |
| Bookings List | ✅ Done | Shows all bookings |
| Booking Detail | ✅ Done | Shows booking info |
| Favorites | ✅ Done | Save/unsave talents |
| Profile Management | ✅ Done | View/edit profile |
| Settings | ✅ Done | Account settings |

### 3. Client Verification Gate
| Feature | Status | Notes |
|---------|--------|-------|
| Redirects after payment | ✅ Done | Redirects to /dashboard/verify |
| Full Name Input | ✅ Done | |
| Phone Number Input | ✅ Done | |
| GPS Location | ✅ Done | Optional |
| **LIVE WEBCAM SELFIE** | ❌ Missing | Using file upload instead |
| Selfie Storage | ✅ Done | Uploads to Supabase Storage |
| Submit to Admin | ✅ Done | Creates verification record |

### 4. Talent Features
| Feature | Status | Notes |
|---------|--------|-------|
| Talent Dashboard | ✅ Done | Overview with stats |
| Availability Toggle | ⚠️ Partial | UI exists |
| Service Menu Config | ✅ Done | Add/edit/remove services |
| Price Minimum (₦100,000) | ❌ Missing | No validation |
| Media Upload | ⚠️ Partial | UI exists, storage may need work |
| Earnings Wallet | ⚠️ UI Only | Shows balance |
| Withdrawal Request | ❌ Missing | Not implemented |
| Booking Requests | ⚠️ Partial | Can view, accept/reject needs work |

### 5. Admin Features
| Feature | Status | Notes |
|---------|--------|-------|
| Admin Panel | ❌ Missing | Route groups exist but empty |
| Review Verifications | ❌ Missing | |
| Approve/Reject Selfies | ❌ Missing | |
| Set Coin Rates | ❌ Missing | |
| Manual Payouts | ❌ Missing | |
| Dispute Resolution | ❌ Missing | |

### 6. Payment System
| Feature | Status | Notes |
|---------|--------|-------|
| Coin-Based Economy | ✅ Done | Wallets, transactions tables |
| Coin Packages UI | ✅ Done | Shows packages |
| Paystack Integration | ❌ Missing | No payment processing |
| Paystack Webhook | ❌ Missing | No API route |
| Escrow System | ⚠️ Partial | Coins moved to escrow on booking |
| Gifting/Tipping | ❌ Missing | |

### 7. Content Features
| Feature | Status | Notes |
|---------|--------|-------|
| Stories Feature | ❌ Missing | |
| Premium/Locked Content | ❌ Missing | |

### 8. API Routes
| Feature | Status | Notes |
|---------|--------|-------|
| /api/webhooks/paystack | ❌ Missing | |
| /api/cron (auto-expire) | ❌ Missing | |

---

## Critical Gaps (Priority Order)

### P0 - Blocking Core Flow
1. **Paystack Integration** - Users cannot buy coins
2. **Admin Verification Panel** - No one can approve verifications
3. **Live Webcam Capture** - Documented as webcam, implemented as file upload

### P1 - Important Features
4. **Service Price Minimum (₦100,000)** - No validation
5. **Talent Booking Requests Management** - Accept/reject flow
6. **Talent Role Bug** - Registration assigns wrong role

### P2 - Secondary Features
7. **Google OAuth Setup** - Needs Supabase configuration
8. **Withdrawal Requests** - Talent payout flow
9. **Real-time Notifications** - Booking alerts

### P3 - Future/Nice to Have
10. **Stories Feature**
11. **Premium Content Monetization**
12. **Cron Job for Auto-expire**

---

## Database Schema Status

### Implemented Tables ✅
- `profiles` - User profiles with role
- `wallets` - Coin balances
- `transactions` - Coin transaction history
- `bookings` - Booking records
- `verifications` - Client verification data
- `talent_menus` - Talent service offerings
- `service_types` - Available service categories
- `media` - Talent media files
- `favorites` - Client saved talents

### Missing Tables ❌
- `stories` - Content/story posts
- `admin_settings` - Coin rates, global minimum price
- `withdrawal_requests` - Talent payout requests
- `disputes` - Dispute records

---

## Storage Buckets Status

### Implemented ✅
- `verifications` - Client selfie uploads (RLS enabled)

### Documented but Not Implemented ❌
- Profile pictures bucket
- Talent media/gallery bucket
- Premium content bucket

---

## Summary

**Overall Implementation: ~60%**

The core client flow (browse → select → book → verify) is functional. However, critical components are missing:

1. **No real payment** - Coins cannot be purchased
2. **No admin oversight** - Verifications cannot be reviewed
3. **No webcam** - Using file upload instead of live capture
4. **Talent flow incomplete** - Missing booking management

The current implementation is a **functional prototype** but not a complete MVP as documented.

---

*Last Updated: January 2026*
*Document Version: 2.0*
