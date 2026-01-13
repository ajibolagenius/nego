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
/                        # Landing page (with talent carousel)
/login                   # Login (redirects by role)
/register                # Register with role selection
/auth/callback           # OAuth callback (Supabase)

/dashboard               # Client dashboard (with notification bell + onboarding)
/dashboard/browse        # Browse talents (+ MobileBottomNav)
/dashboard/bookings      # Bookings list (+ MobileBottomNav)
/dashboard/bookings/[id] # Booking detail (+ talent accept/reject)
/dashboard/messages      # Real-time chat (+ MobileBottomNav)
/dashboard/wallet        # Wallet + Paystack (+ MobileBottomNav)
/dashboard/favorites     # Saved talents (+ MobileBottomNav)
/dashboard/profile       # Profile settings (+ MobileBottomNav)
/dashboard/settings      # Account settings (+ MobileBottomNav)
/dashboard/verify        # Webcam verification gate (+ MobileBottomNav)
/dashboard/talent        # Talent dashboard (5 tabs incl. Withdrawals + MobileBottomNav)

/talent/[id]             # Talent profile

/admin                   # Admin dashboard (mobile responsive + AdminMobileNav)
/admin/verifications     # Review verifications (mobile responsive)
/admin/payouts           # Manage payouts + withdrawals (mobile responsive)
/admin/analytics         # Analytics & Reporting ✅ NEW

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
- [x] Mobile Bottom Navigation ✅ NEW (December 2025)
- [x] Onboarding Modals (Client/Talent/Admin) ✅ NEW (December 2025)
- [x] Talent Withdrawal System ✅ NEW (December 2025)
- [x] Admin Withdrawal Management ✅ NEW (December 2025)
- [x] In-App Notification Bell ✅ NEW (December 2025)
- [x] Dashboard Pages Responsive Enhancements ✅ NEW (December 2025)
- [x] Email Template Improvements ✅ NEW (December 2025)
- [x] Admin Pages Mobile Responsive ✅ NEW (December 2025)
- [x] Admin Mobile Navigation (AdminMobileNav) ✅ NEW (December 2025)
- [x] Landing Page Talent Carousel ✅ NEW (December 2025)
- [x] Notification Bell Mobile Fix ✅ NEW (December 2025)
- [x] Analytics & Reporting Dashboard ✅ NEW (December 2025)

### P3 - Future / Backlog
- [ ] Live Video Calls (Daily.co/Twilio integration)
- [ ] Profile Image Upload
- [ ] Auto-expire Bookings (cron job)
- [ ] Admin Email Digest
- [ ] Reviews and Ratings System
- [ ] Forgot password flow

---

## Mobile UI Components (December 2025)

### MobileBottomNav
- Fixed bottom navigation for mobile screens (<1024px)
- Role-based navigation items:
  - **Client**: Home, Browse, Bookings, Messages, Profile
  - **Talent**: Home, Dashboard, Bookings, Messages, Profile
- Active state highlighting
- All items have `data-testid` attributes for testing
- **Added to all dashboard pages**: browse, bookings, messages, wallet, favorites, profile, settings, verify, talent

### AdminMobileNav
- Fixed bottom navigation for admin pages on mobile
- Navigation items: Dashboard, Verify, Payouts, Analytics
- Mobile header with hamburger menu dropdown
- All admin pages are fully mobile responsive

### OnboardingModal
- First-time user onboarding with role-specific steps
- **Client steps**: Browse Talent → Book & Pay → Verify Identity → Connect
- **Talent steps**: Complete Profile → Set Services → Accept Bookings → Get Paid
- **Admin steps**: Verify Clients → Process Payouts → Monitor Platform
- localStorage tracking with key: `nego_onboarding_{role}_{userId}`
- Skip and Next navigation buttons

### Landing Page Talent Carousel
- Auto-scrolling horizontal carousel (replaces grid)
- Pause on hover
- Left/right navigation arrows
- Click redirects to `/talent/[id]`
- "See All" button links to `/dashboard/browse`
- Gradient fade edges for smooth visual

### Analytics Dashboard (/admin/analytics)
- Key stats: Total Users, Total Bookings, Revenue, Completion Rate
- Charts: User Growth (line), Booking Trends (bar), Revenue Over Time (line)
- Distribution charts: User Roles, Booking Status (pie/donut)
- Quick stats cards: Clients, Talents, Pending, Completed
- Time range filter: This Week / This Month
- Fully mobile responsive

---

*Last Updated: December 2025*
*All SQL Scripts: ✅ RUN*
*Google OAuth: ✅ CONFIGURED*
*Paystack: ✅ CONFIGURED*
*Resend Email: ✅ CONFIGURED*
*Real-time Chat: ✅ COMPLETE*
*Mobile UI: ✅ COMPLETE*
*Onboarding: ✅ COMPLETE*
*Withdrawals: ✅ COMPLETE*
*Admin Mobile: ✅ COMPLETE*
*Analytics: ✅ COMPLETE*
