# Database Setup - SQL Execution Order

Run these SQL scripts in your Supabase SQL Editor in this exact order:

## Required Scripts (Run in Order)

### 1. Core Schema
```
supabase_schema.sql
```
Creates: profiles, wallets, bookings, transactions, media, service_types, talent_menus, verifications, user_unlocks

### 2. Trigger Fix
```
supabase_fix_trigger_v2.sql
```
Fixes: User role assignment on signup

### 3. Notifications & Withdrawals
```
supabase_notifications_withdrawals.sql
```
Creates: notifications, withdrawal_requests tables

### 4. Chat System
```
supabase_chat_tables.sql
```
Creates: conversations, messages tables

### 5. Reviews System
```
supabase_reviews.sql
```
Creates: reviews table with ratings

### 6. Media & Gifting
```
supabase_media_gifting.sql
```
Creates: gifts table, media storage bucket, gift notifications trigger

### 7. Gift Functions
```
supabase_gift_functions_v2.sql
```
Creates: handle_gift() atomic transaction function

### 8. Storage Policies
```
supabase_avatars_storage.sql
```
Creates: Avatar storage bucket and RLS policies

### 9. RLS Policies for Verifications
```
supabase_rls_verifications.sql
```
Creates: Row Level Security policies for verifications

---

## Optional Scripts

### Seed Data (Test Talents)
```
supabase_seed_talents.sql
```
Creates sample talent profiles for testing

### Create Admin User
```
supabase_create_admin.sql
```
Promotes a user to admin role

---

## After Running Scripts

### Enable Realtime
Go to **Database → Replication** and enable for:
- [x] messages
- [x] conversations  
- [x] notifications

### Configure Auth
Go to **Authentication → Providers** and enable:
- [x] Email (enabled by default)
- [ ] Google (optional)

### Storage Buckets
Verify these buckets exist in **Storage**:
- [x] avatars
- [x] media
- [x] profiles

---

## Quick Copy Commands

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Check storage buckets
SELECT * FROM storage.buckets;
```
