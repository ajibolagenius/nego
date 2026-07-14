import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const targetUserId = '34515c64-c09f-4544-b745-b5c6c73a58b6'
  console.log(`Checking auth user: ${targetUserId}`)
  
  const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(targetUserId)
  if (authError || !user) {
    console.error('Error fetching auth user:', authError)
    return
  }

  console.log('Auth user details:', {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    created_at: user.created_at
  })

  // Prepare profile fields
  const userMetadata = user.user_metadata || {}
  const rawRole = userMetadata.role
  const role = ['client', 'talent', 'admin'].includes(rawRole) ? rawRole : 'client'
  
  const displayName = userMetadata.full_name || userMetadata.name || 'User'
  const username = userMetadata.username || null
  const avatarUrl = userMetadata.avatar_url || userMetadata.picture || null
  const email = user.email || null
  const createdAt = user.created_at
  
  const rawGender = userMetadata.gender
  const gender = ['male', 'female', 'other'].includes(rawGender) ? rawGender : null

  console.log('Inserting profile...')
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      role,
      display_name: displayName,
      username,
      avatar_url: avatarUrl,
      email,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
      gender
    })
    .select()

  if (pErr) {
    console.error('Profile insert error:', pErr)
    return
  }
  console.log('Inserted profile:', profile)

  console.log('Inserting wallet...')
  const { data: wallet, error: wErr } = await supabase
    .from('wallets')
    .insert({
      user_id: user.id,
      balance: 0,
      escrow_balance: 0
    })
    .select()

  if (wErr) {
    console.error('Wallet insert error:', wErr)
    return
  }
  console.log('Inserted wallet:', wallet)

  console.log('Inserting notification preferences...')
  const { data: prefs, error: prefErr } = await supabase
    .from('notification_preferences')
    .insert({
      user_id: user.id,
      in_app_enabled: true,
      push_enabled: true,
      email_enabled: true,
      chat_enabled: true
    })
    .select()

  if (prefErr) {
    console.error('Notification preferences insert error:', prefErr)
    return
  }
  console.log('Inserted preferences:', prefs)
  
  console.log('SUCCESS! Backfilled user', user.email)
}

run()
