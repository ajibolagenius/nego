# Nego - Talent Marketplace

A premium, dark-themed talent marketplace built with Next.js 16, Supabase, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ajibolagenius/nego.git
cd nego

# Install dependencies
yarn install

# Set up environment variables (see below)
cp .env.example .env

# Run development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **Yarn** (recommended) or npm
- **Supabase Account** (free tier works)
- **Cloudinary Account** (free tier works)
- **Paystack Account** (for payments - test mode)
- **Resend Account** (for emails - free tier)

---

## 🔧 Environment Setup

### Important Notes

- **Local `.env` files**: These are ignored by Git for security. Use `.env.example` as a template.
- **Do not commit sensitive production keys** to version control.

### 1. Create Environment File

Create a `.env` file in the root directory:

```env
# ===========================================
# SUPABASE (Required)
# Get these from: https://supabase.com/dashboard
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ===========================================
# PAYSTACK (Required for payments)
# Get these from: https://dashboard.paystack.com/#/settings/developers
# ===========================================
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# ===========================================
# RESEND (Required for emails)
# Get this from: https://resend.com/api-keys
# ===========================================
RESEND_API_KEY=re_xxxxxxxxxxxxx
SENDER_EMAIL=Nego <onboarding@resend.dev>

# ===========================================
# CLOUDINARY (Required for media uploads)
# Get these from: https://console.cloudinary.com/settings/api-keys
# ===========================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Get Your API Keys

#### Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Settings → API**
3. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

#### Cloudinary
1. Go to [cloudinary.com](https://cloudinary.com) and create an account
2. Navigate to **Settings → API Keys**
3. Copy your Cloud Name, API Key, and API Secret

#### Paystack
1. Go to [paystack.com](https://paystack.com) and create an account
2. Navigate to **Settings → API Keys & Webhooks**
3. Copy your Test Public Key and Test Secret Key

#### Resend
1. Go to [resend.com](https://resend.com) and create an account
2. Navigate to **API Keys**
3. Create a new API key and copy it

---

## 🗄️ Database Setup

### Run SQL Scripts in Supabase

Go to your Supabase project → **SQL Editor** and run these scripts in order:

#### 1. Main Schema (`supabase_schema.sql`)
Creates all core tables: profiles, wallets, bookings, etc.

#### 2. Notifications & Withdrawals (`supabase_notifications_withdrawals.sql`)
Creates notifications and withdrawal request tables.

#### 3. Chat Tables (`supabase_chat_tables.sql`)
Creates conversations and messages tables for real-time chat.

#### 4. Reviews (`supabase_reviews.sql`)
Creates the reviews and ratings table.

#### 5. Media & Gifting (`supabase_media_gifting.sql`)
Creates gifts table and media storage configuration.

#### 6. Gift Functions (`supabase_gift_functions_v2.sql`)
Creates the atomic gift transaction function.

All SQL files are located in the `database/` directory.

### Enable Realtime

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Enable realtime for these tables:
   - `messages`
   - `conversations`
   - `notifications`

---

## 🏃 Running the Application

### Development Mode
```bash
yarn dev
```

### Production Build
```bash
yarn build
yarn start
```

### Run Tests
```bash
yarn test
```

**Note**: Test scripts may need to be added to `package.json` if not already present.

---

## 📁 Project Structure

```
nego/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── gifts/          # Gift coins API
│   │   │   ├── cloudinary/     # Media upload signatures
│   │   │   ├── email/          # Email sending
│   │   │   ├── webhooks/       # Payment webhooks
│   │   │   ├── admin/          # Admin APIs
│   │   │   └── push/           # Push notifications
│   │   ├── dashboard/          # Protected dashboard pages
│   │   │   ├── browse/         # Browse talents
│   │   │   ├── bookings/       # Booking management & details
│   │   │   ├── messages/       # Real-time chat
│   │   │   ├── wallet/         # Coin wallet
│   │   │   ├── talent/         # Talent dashboard
│   │   │   └── verify/         # Client verification
│   │   ├── admin/              # Admin panel
│   │   │   ├── verifications/  # Client verification management
│   │   │   └── withdrawals/    # Withdrawal processing
│   │   ├── t/[slug]/           # Public talent profile pages
│   │   ├── talent/[id]/        # Alternative talent profile route
│   │   ├── login/              # Authentication
│   │   └── register/           # User registration
│   ├── components/             # React components
│   │   ├── ui/                 # Shadcn UI components
│   │   ├── GiftCoins.tsx       # Gifting modal
│   │   ├── MediaManager.tsx    # Media upload manager
│   │   ├── Reviews.tsx         # Review components
│   │   ├── landing/            # Landing page components
│   │   └── ...
│   ├── lib/                    # Utilities and helpers
│   │   ├── supabase/           # Supabase client configs
│   │   │   ├── client.ts       # Client-side Supabase
│   │   │   ├── server.ts       # Server-side Supabase
│   │   │   └── api.ts          # API client (service role)
│   │   ├── cloudinary.ts       # Cloudinary helpers
│   │   ├── gift-validation.ts  # Gift validation
│   │   └── push/               # Push notification utilities
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── database/                   # SQL migration scripts
├── tests/                      # Python test suite
├── .env                        # Environment variables (create this, not tracked)
├── .env.example                # Environment template (tracked)
├── package.json
├── next.config.ts              # Next.js configuration
└── [SQL Scripts]               # Supabase migration scripts
```

---

## 👥 User Roles

| Role | Description | Dashboard |
|------|-------------|-----------|
| **Client** | Books talents, sends gifts | `/dashboard` |
| **Talent** | Offers services, receives bookings | `/dashboard/talent` |
| **Admin** | Manages platform | `/admin` |

### Test Accounts

After setting up the database, create accounts via `/register`:
- Register as **Client** to browse and book talents
- Register as **Talent** to offer services
- Set `role: 'admin'` in the `profiles` table for admin access

---

## 🔑 Key Features

### For Clients
- Browse talent profiles with reviews and ratings
- Book services with coin payments
- Send gift coins to talents
- Real-time messaging
- Unlock premium content
- Client identity verification (selfie + geolocation)

### For Talents
- Manage service menu & pricing
- Accept/reject bookings
- Upload media (free & premium)
- Track earnings and transaction history
- Request withdrawals
- Receive and respond to reviews
- View booking details with client information

### For Admins
- Verify client identities (view selfie captures and geolocation)
- Process withdrawal requests
- View platform analytics and digest
- Manage platform users and content
- Monitor all transactions

---

## 💰 Payment Flow

1. **Buy Coins**: Client purchases coins via Paystack
2. **Book Service**: Coins held in escrow during booking
3. **Complete Booking**: Coins released to talent
4. **Withdraw**: Talent requests withdrawal → Admin approves

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gifts` | POST | Send gift coins to talents |
| `/api/media/unlock` | POST | Unlock premium content |
| `/api/cloudinary/signature` | GET | Get upload signature for media |
| `/api/transactions/create` | POST | Create payment transaction |
| `/api/webhooks/paystack` | POST | Handle Paystack payment webhooks |
| `/api/email/send` | POST | Send transactional emails |
| `/api/admin/digest` | GET | Get admin dashboard digest (admin only) |
| `/api/push/send` | POST | Send push notifications |

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules yarn.lock
yarn install
```

### Supabase connection issues
- Verify your Supabase URL and keys in `.env`
- Check if the project is paused (free tier pauses after inactivity)

### Images not loading
- Add your Supabase domain to `next.config.ts` remotePatterns
- Verify Cloudinary credentials

### 520 errors on API routes
- Check that middleware excludes `/api` routes
- Verify environment variables are set

### Real-time chat not working
- Enable realtime replication for `messages` and `conversations` tables in Supabase
- Check that Supabase realtime is enabled in your project settings

### Verification images not showing
- Ensure Supabase Storage bucket `verifications` has proper RLS policies
- Check that signed URLs are being generated correctly
- Verify the `selfie_url` field contains valid file paths

### Geolocation errors
- Ensure HTTPS is enabled (geolocation requires secure context)
- Check browser permissions for location access
- Review browser console for specific error codes (PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT)

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Environment Variables to Set:**
- All variables from the `.env` example above
- Ensure `NEXT_PUBLIC_*` variables are set for client-side access
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only

### Other Platforms
The app is a standard Next.js application and can be deployed to:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

**Important**: When deploying, ensure all environment variables are properly configured in your platform's settings.

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For issues or questions:
- Check the troubleshooting section above
- Review Supabase and Next.js documentation
- Open an issue in the repository

---

*Built with ❤️ using Next.js, Supabase, and Tailwind CSS*
