# Nego - Talent Marketplace Platform

A premium, dark-themed talent marketplace platform that connects clients with talented service providers. Built with Next.js 16, Supabase, and modern web technologies.

## 🎯 Overview

Nego is a full-stack marketplace platform that enables:
- **Clients** to discover, book, and interact with talented service providers
- **Talents** to showcase their services, manage bookings, and monetize their skills
- **Admins** to manage the platform, verify users, and process transactions

## 🏗️ Architecture

```
nego/
├── frontend/              # Next.js 16 frontend application
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── tests/                # Python test suite
├── .emergent/            # Emergent deployment configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🚀 Quick Start

1. **Clone and navigate**
   ```bash
   git clone <repository-url>
   cd nego/frontend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment**
   - See [frontend/README.md](./frontend/README.md) for complete setup instructions
   - Copy `.env.example` to `.env` and configure your variables

4. **Run development server**
   ```bash
   yarn dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

**For detailed setup instructions, prerequisites, and troubleshooting, see [frontend/README.md](./frontend/README.md)**

## 📚 Documentation

- **[Frontend README](./frontend/README.md)** - Comprehensive frontend documentation including:
  - Detailed setup instructions
  - API endpoints
  - Database schema
  - Deployment guides
  - Troubleshooting

## 🔑 Key Features

### For Clients
- Browse and search talent profiles
- Book services with coin-based payments
- Send gift coins to talents
- Real-time messaging with talents
- Unlock premium content
- Client identity verification

### For Talents
- Create and manage service menus
- Accept/reject booking requests
- Upload free and premium media content
- Track earnings and transactions
- Request withdrawals
- Receive reviews and ratings

### For Admins
- Verify client identities (with selfie verification)
- Process withdrawal requests
- View platform analytics
- Manage users and content
- Monitor transactions

## 🛠️ Technology Stack

- **Frontend**: Next.js 16.1.1 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Payments**: Paystack integration
- **Media**: Cloudinary for image/video management
- **Email**: Resend for transactional emails
- **Icons**: Phosphor Icons
- **Notifications**: Web Push API with Supabase

## 💰 Payment System

The platform uses a coin-based payment system:

1. **Buy Coins**: Clients purchase coins via Paystack
2. **Book Service**: Coins are held in escrow during booking
3. **Complete Booking**: Coins are released to talent upon completion
4. **Withdraw**: Talents can request withdrawals, which admins approve

## 🚢 Deployment

The project supports multiple deployment platforms:
- **Emergent** (production) - See `.emergent/emergent.yml` for configuration
- **Vercel** (recommended for Next.js)
- **Netlify, Railway, DigitalOcean, AWS Amplify**

**For detailed deployment instructions, see [frontend/README.md](./frontend/README.md)**

## 🧪 Testing

Python test suite available in the `tests/` directory:
- API endpoint tests
- Gift transaction tests
- Edge function tests

## 📁 Project Structure

```
nego/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   │   ├── api/         # API routes
│   │   │   ├── dashboard/   # Protected dashboard pages
│   │   │   ├── admin/        # Admin panel
│   │   │   └── t/           # Public talent profiles
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and helpers
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── tests/                   # Python test suite
└── .emergent/               # Emergent deployment config
```

## 🔒 Security & Privacy

- Row Level Security (RLS) enabled on all Supabase tables
- Service role keys only used server-side
- Client-side uses anon keys with proper RLS policies
- Environment variables properly managed
- Secure file uploads via Cloudinary signed URLs
- Client verification with geolocation and selfie capture

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues or questions:
- Check the [frontend README](./frontend/README.md) troubleshooting section
- Review Supabase and Next.js documentation
- Check the codebase for inline documentation

---

*Built with ❤️ using Next.js, Supabase, and modern web technologies*
