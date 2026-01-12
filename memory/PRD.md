# Nego - Managed Talent Marketplace

## Product Requirements Document (PRD)

### Overview
Nego is a managed talent marketplace connecting service providers (Talent) with clients (Members). It emphasizes a secure, managed environment with a unique post-payment verification gate for client identity.

---

## Tech Stack

| Component | Status |
|-----------|--------|
| Frontend | Next.js 14 (App Router), Shadcn/UI + Tailwind CSS ✅ |
| Backend | Supabase (Auth, Database, API) ✅ |
| Database | PostgreSQL (Supabase) ✅ |
| Media Storage | Supabase Storage ✅ |
| Payments | Paystack (react-paystack) ✅ |
| Webcam | ❌ Using file upload (TODO: react-webcam) |

---

## Feature Implementation Status

### 1. Authentication ✅
- Email/Password Login & Register
- Role Selection (Client/Talent/Admin)
- Session management via Supabase Auth

### 2. Client Features ✅
- Talent Feed/Browse with filters
- Talent Profile View with booking
- Service Selection & Booking
- Wallet with Paystack coin purchase
- Bookings List/Detail
- Favorites
- Profile & Settings

### 3. Paystack Integration ✅
- Coin packages (500/1000/2500/5000 coins)
- Payment modal with Paystack checkout
- Transaction create API
- Webhook with HMAC verification
- Auto-credit coins on payment success

### 4. Client Verification Gate ✅
- Post-booking redirect
- Full name, phone, GPS collection
- Selfie upload (file) to Supabase Storage
- Verification record creation

### 5. Talent Features ✅
- Talent Dashboard with stats
- Service Menu Management
- Media Upload UI
- Booking view

### 6. Admin Panel ✅ **NEW**
| Route | Feature | Status |
|-------|---------|--------|
| `/admin` | Dashboard with stats | ✅ |
| `/admin/verifications` | Review client selfies | ✅ |
| `/admin/payouts` | Manage talent earnings | ✅ |

**Admin Features:**
- View pending/approved/rejected verifications
- Approve/Reject with admin notes
- View all talent balances
- Payout history
- Admin-only access control

---

## Routes Structure

```
/                        # Landing page
/login                   # Login
/register                # Register with role selection

/dashboard               # Client dashboard
/dashboard/browse        # Browse talents
/dashboard/bookings      # Bookings list
/dashboard/bookings/[id] # Booking detail
/dashboard/wallet        # Wallet + Paystack
/dashboard/favorites     # Saved talents
/dashboard/profile       # Profile settings
/dashboard/settings      # Account settings
/dashboard/verify        # Verification gate
/dashboard/talent        # Talent dashboard

/talent/[id]             # Talent profile

/admin                   # Admin dashboard ✅
/admin/verifications     # Review verifications ✅
/admin/payouts           # Manage payouts ✅

/api/transactions/create # Create transaction
/api/webhooks/paystack   # Paystack webhook
```

---

## Database Tables

| Table | Purpose | Status |
|-------|---------|--------|
| profiles | User profiles (client/talent/admin) | ✅ |
| wallets | Coin balances | ✅ |
| transactions | Transaction history | ✅ |
| bookings | Booking records | ✅ |
| verifications | Verification data | ✅ |
| talent_menus | Service offerings | ✅ |
| service_types | Service categories | ✅ |
| media | Talent media | ✅ |
| favorites | Saved talents | ✅ |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Paystack (add your keys)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
```

---

## Admin Setup

To create an admin user:
1. Register a new user normally
2. Run this SQL in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

Or use the provided script: `/app/frontend/supabase_create_admin.sql`

---

## Remaining Tasks

### P0 - Critical
- [ ] **Live Webcam Capture** - Replace file upload with react-webcam

### P1 - Important
- [ ] Service price minimum validation (₦100,000)
- [ ] Talent booking accept/reject flow
- [ ] Withdrawal request processing

### P2 - Secondary
- [ ] Google OAuth configuration
- [ ] Real-time notifications
- [ ] Cron job for auto-expire bookings

---

*Last Updated: January 2026*
*Admin Panel: ✅ COMPLETE*
*Paystack: ✅ COMPLETE*
