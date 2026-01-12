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
| Webcam | react-webcam ✅ |

---

## Feature Implementation Status

### 1. Authentication ✅
- Email/Password Login & Register
- Role Selection (Client/Talent/Admin)
- Admin auto-redirect to /admin on login
- Talent auto-redirect to /dashboard/talent on login
- **DB Trigger Fix Applied** - Role is now correctly read from user metadata during signup

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
- **Note**: Requires user to add their Paystack API keys

### 4. Live Webcam Verification ✅
- Uses `react-webcam` for live camera capture
- Square viewport (480x480) for selfie
- Face guide overlay (circular)
- Capture button with photo preview
- Retake functionality
- Uploads captured image to Supabase Storage
- 4-step flow: Intro → Selfie → Details → Complete

### 5. Talent Features ✅
- Talent Dashboard with stats
- Service Menu Management
- Media Upload UI
- Booking view with Action Required badges
- **Booking Accept/Reject Flow** ✅ NEW

### 6. Admin Panel ✅
| Route | Feature | Status |
|-------|---------|--------|
| `/admin` | Dashboard with stats | ✅ |
| `/admin/verifications` | Review client selfies | ✅ |
| `/admin/payouts` | Manage talent earnings | ✅ |

### 7. Talent Booking Accept/Reject Flow ✅ NEW (December 2025)
- Talents can **Accept** booking requests (moves to `confirmed` status)
- Talents can **Decline** booking requests with optional reason
- Talents can **Mark as Completed** after the session
- **Action Required** badge on pending bookings in Talent Dashboard
- Pending Action Alert shows count of bookings needing response

---

## Routes Structure

```
/                        # Landing page
/login                   # Login (redirects by role)
/register                # Register with role selection

/dashboard               # Client dashboard
/dashboard/browse        # Browse talents
/dashboard/bookings      # Bookings list
/dashboard/bookings/[id] # Booking detail (+ talent accept/reject)
/dashboard/wallet        # Wallet + Paystack
/dashboard/favorites     # Saved talents
/dashboard/profile       # Profile settings
/dashboard/settings      # Account settings
/dashboard/verify        # Webcam verification gate
/dashboard/talent        # Talent dashboard

/talent/[id]             # Talent profile

/admin                   # Admin dashboard
/admin/verifications     # Review verifications
/admin/payouts           # Manage payouts

/api/transactions/create # Create transaction
/api/webhooks/paystack   # Paystack webhook
```

---

## Booking Flow

```
1. Client browses talent → Books services
2. Booking created with status: `payment_pending`
3. Client pays with coins → Status: `verification_pending`
4. Talent sees booking with "Action Required" badge
5. Talent accepts → Status: `confirmed`
   OR Talent declines → Status: `cancelled`
6. Client completes verification (webcam selfie)
7. Meeting happens
8. Talent marks as completed → Status: `completed`
```

---

## Remaining Tasks

### P1 - Important
- [ ] Service price minimum validation (₦100,000)
- [ ] Withdrawal request processing

### P2 - Secondary
- [ ] Google OAuth configuration
- [ ] Real-time notifications
- [ ] Cron job for auto-expire bookings

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

To create an admin user, run this SQL in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

---

## SQL Scripts Reference

| Script | Purpose |
|--------|---------|
| `supabase_fix_trigger_v2.sql` | Fix for handle_new_user() trigger to read role from metadata |
| `supabase_create_admin.sql` | Helper script to create admin users |

---

*Last Updated: December 2025*
*Registration Fix: ✅ COMPLETE*
*Talent Booking Accept/Reject: ✅ COMPLETE*
*Webcam Verification: ✅ COMPLETE*
*Paystack: ✅ COMPLETE (awaiting user API keys)*
*Admin Panel: ✅ COMPLETE*
