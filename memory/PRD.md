# Nego - Managed Talent Marketplace

## Product Requirements Document (PRD)

### Overview
Nego is a managed talent marketplace connecting service providers (Talent) with clients (Members). It emphasizes a secure, managed environment with a unique post-payment verification gate for client identity.

---

## Tech Stack

| Component | Target (Documented) | Current Status |
|-----------|---------------------|----------------|
| Frontend | Next.js 14 (App Router), Shadcn/UI + Tailwind CSS | ✅ Implemented |
| Backend | Supabase (Auth, Database, API) | ✅ Implemented |
| Database | PostgreSQL (Supabase) | ✅ Implemented |
| Media Storage | Cloudinary | ⚠️ Using Supabase Storage |
| Payments | Paystack (react-paystack) | ✅ Implemented |
| Webcam | react-webcam | ❌ Using file upload |
| Hosting | Vercel | ⚠️ Emergent Platform |

---

## Feature Implementation Status

### 1. Authentication ✅
| Feature | Status |
|---------|--------|
| Email/Password Login | ✅ Done |
| Email/Password Register | ✅ Done |
| Role Selection (Client/Talent) | ✅ Done (Bug: trigger may default to 'client') |
| Google OAuth | ⚠️ Button exists, needs Supabase config |

### 2. Client Features
| Feature | Status |
|---------|--------|
| Talent Feed/Browse | ✅ Done |
| Talent Profile View | ✅ Done |
| Service Selection & Booking | ✅ Done |
| Wallet UI | ✅ Done |
| **Coin Purchase (Paystack)** | ✅ **IMPLEMENTED** |
| Bookings List/Detail | ✅ Done |
| Favorites | ✅ Done |
| Profile & Settings | ✅ Done |

### 3. Paystack Integration ✅ NEW
| Component | Status |
|-----------|--------|
| Coin Packages Config | ✅ `/lib/coinPackages.ts` |
| Payment Modal UI | ✅ Implemented |
| Transaction Create API | ✅ `/api/transactions/create` |
| Paystack Webhook | ✅ `/api/webhooks/paystack` |
| Signature Verification | ✅ HMAC-SHA512 |
| Wallet Credit on Success | ✅ Implemented |

**To Enable Payments:**
Add to `/app/frontend/.env`:
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

### 4. Client Verification Gate
| Feature | Status |
|---------|--------|
| Redirects after payment | ✅ Done |
| Full Name/Phone Input | ✅ Done |
| GPS Location | ✅ Done |
| Selfie Capture | ⚠️ File upload (not webcam) |
| Selfie Storage | ✅ Supabase Storage |

### 5. Talent Features
| Feature | Status |
|---------|--------|
| Talent Dashboard | ✅ Done |
| Service Menu Config | ✅ Done |
| Media Upload | ⚠️ Partial |
| Booking Requests | ⚠️ View only |
| Withdrawals | ❌ Missing |

### 6. Admin Features ❌
| Feature | Status |
|---------|--------|
| Admin Panel | ❌ Not implemented |
| Review Verifications | ❌ Not implemented |
| Manual Payouts | ❌ Not implemented |

---

## Critical Gaps (Updated Priority)

### P0 - Blocking Core Flow
1. ~~**Paystack Integration**~~ ✅ DONE
2. **Admin Verification Panel** ❌ - No one can approve verifications
3. **Live Webcam Capture** ❌ - Using file upload instead

### P1 - Important Features
4. **Service Price Minimum (₦100,000)** - No validation
5. **Talent Booking Management** - Accept/reject flow
6. **Withdrawal Requests** - Talent payout flow

### P2 - Secondary Features
7. **Google OAuth Setup**
8. **Real-time Notifications**

---

## API Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/api/transactions/create` | Create pending transaction | ✅ |
| `/api/webhooks/paystack` | Handle Paystack webhook | ✅ |
| `/api/cron` | Auto-expire bookings | ❌ |

---

## Database Tables

### Implemented ✅
- `profiles` - User profiles
- `wallets` - Coin balances
- `transactions` - Transaction history (updated with `reference`, `status`, `coins`)
- `bookings` - Booking records
- `verifications` - Verification data
- `talent_menus` - Service offerings
- `service_types` - Service categories
- `media` - Media files
- `favorites` - Saved talents

---

## File Structure (Key Files)

```
/app/frontend/src/
├── app/
│   ├── api/
│   │   ├── transactions/create/route.ts  # NEW - Create transaction
│   │   └── webhooks/paystack/route.ts    # NEW - Paystack webhook
│   ├── dashboard/
│   │   ├── wallet/
│   │   │   ├── page.tsx
│   │   │   └── WalletClient.tsx          # Updated with Paystack
│   │   └── ...
│   └── ...
├── lib/
│   └── coinPackages.ts                    # NEW - Package config
└── types/
    └── database.ts                        # Updated Transaction type
```

---

## Next Steps

1. **Admin Panel** - Create `/admin/verifications` and `/admin/payouts`
2. **Webcam Capture** - Replace file upload with react-webcam
3. **Configure Paystack** - User adds API keys to enable payments

---

*Last Updated: January 2026*
*Paystack Integration: ✅ COMPLETE*
