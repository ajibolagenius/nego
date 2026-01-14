# Local Development Setup Guide

This guide walks you through setting up the Nego project on your local machine with Cursor IDE.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed ([download](https://nodejs.org/))
- [ ] **Yarn** installed (`npm install -g yarn`)
- [ ] **Git** installed ([download](https://git-scm.com/))
- [ ] **Cursor IDE** installed ([download](https://cursor.sh/))
- [ ] **Supabase account** ([sign up](https://supabase.com))
- [ ] **Cloudinary account** ([sign up](https://cloudinary.com))
- [ ] **Paystack account** ([sign up](https://paystack.com))
- [ ] **Resend account** ([sign up](https://resend.com))

---

## Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/nego.git

# Navigate to project
cd nego
```

---

## Step 2: Open in Cursor IDE

1. Launch **Cursor IDE**
2. Click **File → Open Folder**
3. Select the `nego` folder you just cloned
4. Wait for Cursor to index the project

---

## Step 3: Install Dependencies

Open Cursor's integrated terminal (`Ctrl+`` or `Cmd+``) and run:

```bash
cd frontend
yarn install
```

This will install all required packages (~2-3 minutes).

---

## Step 4: Set Up Supabase

### 4.1 Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Enter project name: `nego`
4. Set a database password (save this!)
5. Select a region close to you
6. Click **"Create new project"**
7. Wait for the project to be ready (~2 minutes)

### 4.2 Get Your API Keys

1. In your Supabase project, go to **Settings → API**
2. Copy these values:

| Setting | Environment Variable |
|---------|---------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

### 4.3 Run Database Migrations

1. In Supabase, go to **SQL Editor**
2. Run these SQL files in order (copy/paste from `/frontend` folder):

```
1. supabase_schema.sql
2. supabase_notifications_withdrawals.sql
3. supabase_chat_tables.sql
4. supabase_reviews.sql
5. supabase_media_gifting.sql
6. supabase_gift_functions_v2.sql
```

### 4.4 Enable Realtime

1. Go to **Database → Replication**
2. Under "Realtime", toggle ON for:
   - `messages`
   - `conversations`
   - `notifications`

### 4.5 Configure Google OAuth (Optional)

1. Go to **Authentication → Providers**
2. Enable **Google**
3. Add your Google OAuth credentials

---

## Step 5: Set Up Cloudinary

1. Go to [cloudinary.com/console](https://cloudinary.com/console)
2. Sign up or log in
3. From the Dashboard, copy:
   - **Cloud Name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
4. Go to **Settings → API Keys**
5. Copy:
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

---

## Step 6: Set Up Paystack

1. Go to [dashboard.paystack.com](https://dashboard.paystack.com)
2. Sign up or log in
3. Go to **Settings → API Keys & Webhooks**
4. Copy (use **Test** keys for development):
   - **Test Public Key** → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - **Test Secret Key** → `PAYSTACK_SECRET_KEY`

---

## Step 7: Set Up Resend

1. Go to [resend.com](https://resend.com)
2. Sign up or log in
3. Go to **API Keys**
4. Click **"Create API Key"**
5. Copy the key → `RESEND_API_KEY`

---

## Step 8: Create Environment File

1. In Cursor, right-click on the `frontend` folder
2. Select **"New File"**
3. Name it `.env`
4. Paste the following and fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx

# Resend
RESEND_API_KEY=re_xxx
SENDER_EMAIL=Nego <onboarding@resend.dev>

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Step 9: Run the Application

In Cursor's terminal:

```bash
cd frontend
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

🎉 **You should see the Nego landing page!**

---

## Step 10: Create Test Accounts

1. Go to [http://localhost:3000/register](http://localhost:3000/register)
2. Create a **Client** account
3. Create a **Talent** account (use different email)
4. To create an **Admin**:
   - Register a normal account
   - In Supabase, go to **Table Editor → profiles**
   - Find your user and change `role` to `admin`

---

## Common Issues & Fixes

### Issue: "Module not found"
```bash
rm -rf node_modules yarn.lock
yarn install
```

### Issue: "Invalid API key"
- Double-check all keys in `.env` have no extra spaces
- Make sure you're using the correct keys (test vs live)

### Issue: "Supabase connection failed"
- Check if your Supabase project is active (free tier pauses after 7 days)
- Verify the URL and keys are correct

### Issue: Images not loading
The app uses Next.js Image component. If images from Supabase aren't loading:
1. Check `next.config.mjs` has your Supabase domain in `remotePatterns`

### Issue: Real-time chat not working
- Ensure you enabled Realtime for `messages` and `conversations` tables
- Check browser console for WebSocket errors

---

## Development Workflow

### Running in Development
```bash
yarn dev
```

### Building for Production
```bash
yarn build
yarn start
```

### Linting
```bash
yarn lint
```

### Type Checking
```bash
yarn type-check
```

---

## Project Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |
| `yarn type-check` | Run TypeScript checks |

---

## Need Help?

1. **Check the README.md** for more detailed documentation
2. **Review the /docs folder** for API documentation
3. **Check Supabase logs** for database errors
4. **Check browser console** for frontend errors

---

## Next Steps

Once everything is running:

1. **Explore the codebase** - Start with `/src/app` for pages
2. **Try the features** - Create bookings, send gifts, upload media
3. **Customize** - Modify styles in `tailwind.config.ts`
4. **Add features** - The codebase is well-structured for extensions

Happy coding! 🚀
