# Web Push Notifications - Complete Setup Guide

## ✅ Implementation Status

All components for Web Push API support have been implemented:

### Core Components
- ✅ Service Worker (`/public/sw.js`) - Handles push events and notification clicks
- ✅ Service Worker Registration (`ServiceWorkerRegistration.tsx`) - Auto-registers on app load
- ✅ Push Notification Manager (`PushNotificationManager.tsx`) - User-facing UI for enabling/disabling
- ✅ VAPID Key Management (`lib/push/vapid.ts`) - Secure key handling
- ✅ Push Notification Sending (`lib/push/send-push.ts`) - Server-side push sending
- ✅ Notification Integration (`lib/notifications/create-with-push.ts`) - Helper for creating notifications with push

### API Endpoints
- ✅ `GET /api/push/vapid-key` - Returns VAPID public key
- ✅ `POST /api/push/subscribe` - Save push subscription
- ✅ `POST /api/push/unsubscribe` - Remove push subscription
- ✅ `POST /api/push/send` - Send push notification (admin/self)

### Database
- ✅ SQL migration file created (`supabase_push_subscriptions.sql`)
- ⚠️ **Action Required**: Run SQL migration in Supabase

### Integration
- ✅ Integrated with admin verification reject (sends push)
- ✅ Integrated with admin payout approve/reject (sends push)
- ⚠️ Other notification creation points can be updated to use `createNotificationWithPush`

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
cd frontend
npm install web-push --legacy-peer-deps
npm install --save-dev @types/web-push --legacy-peer-deps
```
✅ **Already completed**

### Step 2: Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa40HI9Hk3wE8KT...
Private Key: V8t5bImxps1ukX1MqG0Ae63...
```

### Step 3: Set Environment Variables

Add to `frontend/.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=notifications@yourdomain.com
```

**Important Notes:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` must start with `NEXT_PUBLIC_` to be accessible in browser
- `VAPID_PRIVATE_KEY` should NEVER be exposed to client
- `VAPID_EMAIL` is used as contact email for VAPID (can be any valid email)

### Step 4: Run Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste contents of `frontend/supabase_push_subscriptions.sql`
3. Execute the SQL

This will:
- Create `push_subscriptions` table
- Add `push_notifications_enabled` column to `profiles`
- Set up Row Level Security (RLS) policies
- Create indexes for performance

### Step 5: Test the Implementation

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Enable push notifications:**
   - Navigate to `/dashboard/settings`
   - Click "Enable Push Notifications"
   - Grant permission when prompted

3. **Test push notification:**
   - As admin, approve/reject a verification or payout
   - User should receive push notification (even if app is closed)

---

## 📋 How It Works

### User Flow

1. **User enables notifications:**
   - Clicks "Enable Push Notifications" in Settings
   - Browser requests permission
   - Service worker is registered
   - User subscribes with VAPID public key
   - Subscription is saved to database

2. **Notification is created:**
   - API route creates notification in database
   - `createNotificationWithPush` helper is called
   - Push notification is sent to all user's subscriptions
   - Service worker receives push event
   - Notification is displayed to user

3. **User clicks notification:**
   - Service worker handles click
   - Opens/closes app window
   - Navigates to notifications page

### Technical Flow

```
Notification Created
    ↓
createNotificationWithPush()
    ↓
Insert to notifications table
    ↓
sendPushForNotification()
    ↓
Get user subscriptions from DB
    ↓
Check push_notifications_enabled
    ↓
sendPushNotification() for each subscription
    ↓
web-push library sends to push service
    ↓
Service Worker receives push event
    ↓
Shows notification to user
```

---

## 🔧 Integration Points

### Current Integration
- ✅ Admin verification reject → Push notification
- ✅ Admin payout approve → Push notification
- ✅ Admin payout reject → Push notification

### Can Be Integrated
To add push notifications to other notification creation points, replace:
```typescript
await supabase.from('notifications').insert({...})
```

With:
```typescript
const { createNotificationWithPush } = await import('@/lib/notifications/create-with-push')
await createNotificationWithPush({
    user_id: userId,
    type: 'notification_type',
    title: 'Title',
    message: 'Message',
    data: {},
    sendPush: true, // Default: true
})
```

**Locations to update:**
- `frontend/src/app/api/gifts/route.ts` - Gift notifications
- `frontend/src/app/api/media/unlock/route.ts` - Media unlock notifications
- `frontend/src/app/api/webhooks/paystack/route.ts` - Payment notifications
- `frontend/src/app/api/bookings/expire/route.ts` - Booking expiry notifications

---

## 🎯 Features

- ✅ **Real-time push notifications** - Works even when app is closed
- ✅ **Mobile & Desktop support** - Works on all modern browsers
- ✅ **Secure** - VAPID authentication
- ✅ **User preferences** - Respects `push_notifications_enabled` flag
- ✅ **Automatic cleanup** - Removes expired subscriptions
- ✅ **Multiple devices** - Supports multiple subscriptions per user
- ✅ **Secure** - RLS policies protect subscription data

---

## 🐛 Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure `/public/sw.js` exists
- Verify HTTPS (required in production)
- Check browser supports service workers

### Push Notifications Not Received
1. Check notification permission is granted
2. Verify VAPID keys are set correctly in `.env.local`
3. Check subscription exists in `push_subscriptions` table:
   ```sql
   SELECT * FROM push_subscriptions WHERE user_id = 'user-id';
   ```
4. Verify `push_notifications_enabled = true` in profiles:
   ```sql
   SELECT push_notifications_enabled FROM profiles WHERE id = 'user-id';
   ```
5. Check server logs for errors

### VAPID Key Errors
- Ensure keys are base64 URL-safe encoded
- Verify environment variables are loaded (restart dev server)
- Check server logs for initialization errors
- Ensure `NEXT_PUBLIC_` prefix on public key

### Subscription Not Saving
- Check RLS policies are set up correctly
- Verify user is authenticated
- Check database logs for errors
- Ensure `push_subscriptions` table exists

---

## 📱 Browser Support

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Full support |
| Firefox | ✅ | ✅ | Full support |
| Edge | ✅ | ✅ | Full support |
| Safari | ✅ | ✅ | iOS 16.4+, macOS |
| Opera | ✅ | ✅ | Full support |

---

## 🔒 Security

- VAPID private key is server-only (never exposed to client)
- Push subscriptions are protected by RLS policies
- Only authenticated users can subscribe/unsubscribe
- Users can only manage their own subscriptions
- Push notifications respect user preferences

---

## 📝 Next Steps (Optional)

1. **Database Trigger Approach** (Advanced):
   - Create Supabase database function that automatically sends push when notification is inserted
   - This would eliminate need to update all API routes

2. **Notification Preferences**:
   - Add granular notification preferences (email, push, in-app)
   - Allow users to choose notification types

3. **Rich Notifications**:
   - Add images to push notifications
   - Custom notification sounds
   - Action buttons for quick actions

4. **Analytics**:
   - Track push notification delivery rates
   - Monitor subscription health
   - Track notification click-through rates

---

## 📚 Files Reference

### Core Files
- `frontend/public/sw.js` - Service worker
- `frontend/src/components/ServiceWorkerRegistration.tsx` - SW registration
- `frontend/src/components/PushNotificationManager.tsx` - User UI
- `frontend/src/lib/push/vapid.ts` - VAPID utilities
- `frontend/src/lib/push/send-push.ts` - Push sending
- `frontend/src/lib/push/notification-integration.ts` - Integration helper
- `frontend/src/lib/notifications/create-with-push.ts` - Notification helper

### API Routes
- `frontend/src/app/api/push/vapid-key/route.ts`
- `frontend/src/app/api/push/subscribe/route.ts`
- `frontend/src/app/api/push/unsubscribe/route.ts`
- `frontend/src/app/api/push/send/route.ts`

### Database
- `frontend/supabase_push_subscriptions.sql` - Migration file

### Documentation
- `frontend/README_PUSH_NOTIFICATIONS.md` - Detailed guide
- `frontend/PUSH_NOTIFICATIONS_SETUP.md` - This file

---

## ✅ Checklist

- [x] Service worker implemented
- [x] Service worker registration component
- [x] Push notification manager UI
- [x] VAPID key management
- [x] API endpoints created
- [x] Database migration SQL created
- [x] Integration with admin routes
- [x] Helper functions created
- [x] Documentation written
- [ ] **VAPID keys generated** (User action required)
- [ ] **Environment variables set** (User action required)
- [ ] **Database migration run** (User action required)
- [ ] **Test push notifications** (User action required)

---

## 🎉 Ready to Use!

Once you complete the setup steps (VAPID keys, environment variables, database migration), push notifications will be fully functional!
