import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Service role client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testWithNewUser() {
  console.log('Creating a temporary test user...')
  const testEmail = `temp-test-${Date.now()}@negoempire.live`
  const testPassword = 'Password123!'
  
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { role: 'client', full_name: 'Test Client' }
  })

  if (createError) {
    console.error('Failed to create test user:', createError)
    return
  }

  const tempUser = createData.user
  console.log('Created user:', tempUser.id)

  const clientSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })

  if (signInError) {
    console.error('Sign in failed:', signInError)
    // Clean up
    await supabaseAdmin.auth.admin.deleteUser(tempUser.id)
    return
  }

  console.log('Successfully signed in as temporary test user!')
  
  try {
    await performInsert(clientSupabase, tempUser.id)
  } finally {
    // Clean up
    console.log('Cleaning up temporary user...')
    await supabaseAdmin.auth.admin.deleteUser(tempUser.id)
  }
}

async function performInsert(clientSupabase: any, userId: string) {
  console.log('Attempting insert into deposit_requests using signed-in client...')
  const { data, error } = await clientSupabase
    .from('deposit_requests')
    .insert({
      user_id: userId,
      amount: 5000,
      proof_url: 'https://example.com/test-proof.jpg',
      status: 'pending',
    })
    .select()

  if (error) {
    console.error('Insert failed with error object:', error)
    console.error('Error Code:', error.code)
    console.error('Error Message:', error.message)
    console.error('Error Details:', error.details)
    console.error('Error Hint:', error.hint)
  } else {
    console.log('Insert SUCCEEDED!', data)
    // delete
    await clientSupabase.from('deposit_requests').delete().eq('id', data[0].id)
  }
}

testWithNewUser()
