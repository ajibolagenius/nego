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
| Email | Resend ✅ NEW |

---

## Feature Implementation Status

### 1. Authentication ✅
- Email/Password Login & Register
- **Google OAuth via Emergent Auth** ✅ NEW
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
- **Messages** ✅ NEW

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
- **Service Price Minimum Validation** (₦100,000) ✅
- Media Upload UI
- Booking view with Action Required badges
- **Booking Accept/Reject Flow** ✅
- **Withdrawals Tab** with withdrawal request form ✅

### 6. Admin Panel ✅
| Route | Feature | Status |
|-------|---------|--------|
| `/admin` | Dashboard with stats | ✅ |
| `/admin/verifications` | Review client selfies | ✅ |
| `/admin/payouts` | Manage talent earnings | ✅ |

### 7. Push Notifications ✅
- **NotificationBell component** in header for authenticated users
- Real-time Supabase subscription for instant notifications
- Browser push notification permission request
- Notification types: booking_request, booking_accepted, booking_rejected, etc.
- Mark as read functionality
- Notification dropdown with history

### 8. Google OAuth ✅ (December 2025)
- **Supabase native OAuth** integration
- One-click sign in with Google
- Callback at `/auth/callback`
- Role selection preserved through OAuth flow (stored in localStorage)
- Works alongside email/password auth
- **Requires**: Configure Google OAuth in Supabase Dashboard

### 9. Real-time Chat ✅ NEW (December 2025)
- Direct messaging between clients and talents
- Conversations list with search
- Real-time message updates via Supabase subscriptions
- Message read status
- Mobile-responsive design
- Accessible from `/dashboard/messages`
- **Requires**: Run `supabase_chat_tables.sql` to create tables

### 10. Email Notifications ✅ NEW (December 2025)
- **Resend** integration for transactional emails
- Email templates:
  - Welcome email for new users
  - New booking notification for talents
  - Booking status updates for clients
- Branded HTML emails with Nego design
- API route at `/api/email/send`
- **Requires**: Add your `RESEND_API_KEY` to `.env`

---

## Routes Structure

```
/                        # Landing page
/login                   # Login (redirects by role)
/register                # Register with role selection
/auth/callback           # OAuth callback (Supabase)

/dashboard               # Client dashboard (with notification bell)
/dashboard/browse        # Browse talents
/dashboard/bookings      # Bookings list
/dashboard/bookings/[id] # Booking detail (+ talent accept/reject)
/dashboard/messages      # Real-time chat ✅ NEW
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
/api/email/send          # Send transactional emails ✅ NEW
```

---

## SQL Scripts to Run

| Script | Purpose | Status |
|--------|---------|--------|
| `supabase_fix_trigger_v2.sql` | Fix handle_new_user() trigger | ✅ RUN |
| `supabase_notifications_withdrawals.sql` | Notifications + Withdrawals tables | ✅ RUN |
| `supabase_chat_tables.sql` | Chat messages + conversations tables | ✅ RUN |

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

# Resend Email ✅ CONFIGURED
RESEND_API_KEY=re_xxx
SENDER_EMAIL=Nego <onboarding@resend.dev>

# Google OAuth ✅ CONFIGURED (in Supabase Dashboard)
```

---

## Remaining Tasks

### P2 - Secondary (Completed this session)
- [x] Google OAuth integration ✅
- [x] Real-time chat ✅
- [x] Email notifications (Resend) ✅

### P3 - Future
- [ ] Forgot password flow
- [ ] Profile image upload
- [ ] Cron job for auto-expire bookings
- [ ] Admin email notifications digest

---

*Last Updated: December 2025*
*Google OAuth: ✅ COMPLETE*
*Real-time Chat: ✅ COMPLETE*
*Email Notifications: ✅ COMPLETE*
