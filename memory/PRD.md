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
- **API Keys Configured** ✅

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
- **Service Price Minimum Validation** (₦100,000) ✅ NEW
- Media Upload UI
- Booking view with Action Required badges
- **Booking Accept/Reject Flow** ✅
- **Withdrawals Tab** with withdrawal request form ✅ NEW

### 6. Admin Panel ✅
| Route | Feature | Status |
|-------|---------|--------|
| `/admin` | Dashboard with stats | ✅ |
| `/admin/verifications` | Review client selfies | ✅ |
| `/admin/payouts` | Manage talent earnings | ✅ |

### 7. Push Notifications ✅ NEW (December 2025)
- **NotificationBell component** in header for authenticated users
- Real-time Supabase subscription for instant notifications
- Browser push notification permission request
- Notification types: booking_request, booking_accepted, booking_rejected, etc.
- Mark as read functionality
- Notification dropdown with history
- **Requires**: Run `supabase_notifications_withdrawals.sql` to create tables

### 8. Withdrawal System ✅ NEW (December 2025)
- Talents can request withdrawals from the Withdrawals tab
- Bank details form (Bank name, Account number, Account name)
- Minimum withdrawal: 10,000 coins
- Supported banks: Access, First Bank, GTBank, UBA, Zenith, Kuda, Opay, Palmpay
- Admin can process withdrawals from `/admin/payouts`
- **Requires**: Run `supabase_notifications_withdrawals.sql` to create tables

---

## Routes Structure

```
/                        # Landing page
/login                   # Login (redirects by role)
/register                # Register with role selection

/dashboard               # Client dashboard (with notification bell)
/dashboard/browse        # Browse talents
/dashboard/bookings      # Bookings list
/dashboard/bookings/[id] # Booking detail (+ talent accept/reject)
/dashboard/wallet        # Wallet + Paystack
/dashboard/favorites     # Saved talents
/dashboard/profile       # Profile settings
/dashboard/settings      # Account settings
/dashboard/verify        # Webcam verification gate
/dashboard/talent        # Talent dashboard (5 tabs incl. Withdrawals)

/talent/[id]             # Talent profile

/admin                   # Admin dashboard
/admin/verifications     # Review verifications
/admin/payouts           # Manage payouts + withdrawals

/api/transactions/create # Create transaction
/api/webhooks/paystack   # Paystack webhook
```

---

## Booking Flow

```
1. Client browses talent → Books services
2. Booking created with status: `payment_pending`
3. Client pays with coins → Status: `verification_pending`
4. Talent receives push notification "New Booking Request!"
5. Talent accepts → Status: `confirmed`
   OR Talent declines → Status: `cancelled`
6. Client completes verification (webcam selfie)
7. Meeting happens
8. Talent marks as completed → Status: `completed`
9. Talent can request withdrawal from Withdrawals tab
```

---

## SQL Scripts to Run

| Script | Purpose | Status |
|--------|---------|--------|
| `supabase_fix_trigger_v2.sql` | Fix handle_new_user() trigger for role assignment | ✅ RUN |
| `supabase_create_admin.sql` | Helper to create admin users | Optional |
| `supabase_notifications_withdrawals.sql` | Create notifications and withdrawal_requests tables | **RUN THIS** |

---

## Remaining Tasks

### P1 - Important
- [x] Service price minimum validation (₦100,000) ✅
- [x] Withdrawal request processing ✅
- [x] Push notifications for booking requests ✅

### P2 - Secondary
- [ ] Google OAuth configuration
- [ ] Real-time chat between client and talent
- [ ] Email notifications (SendGrid/Resend)
- [ ] Cron job for auto-expire bookings

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Paystack ✅ CONFIGURED
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
```

---

*Last Updated: December 2025*
*Push Notifications: ✅ COMPLETE*
*Service Price Validation: ✅ COMPLETE*
*Withdrawal System: ✅ COMPLETE*
*Paystack: ✅ COMPLETE*
