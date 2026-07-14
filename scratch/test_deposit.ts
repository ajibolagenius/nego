import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('Fetching deposit requests from Supabase...')
  const { data, error } = await supabase
    .from('deposit_requests')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error fetching deposit requests:', error)
  } else {
    console.log('Deposit requests:', data)
  }

  // Let's check profiles to get a valid user_id
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .limit(5)

  if (profileError) {
    console.error('Error fetching profiles:', profileError)
    return
  }
  console.log('Profiles:', profiles)

  if (profiles && profiles.length > 0) {
    const testUser = profiles[0]
    console.log(`Attempting insert for user: ${testUser.email} (ID: ${testUser.id})`)
    const { data: insertData, error: insertError } = await supabase
      .from('deposit_requests')
      .insert({
        user_id: testUser.id,
        amount: 5000,
        proof_url: 'https://example.com/proof.jpg',
        status: 'pending',
      })
      .select()

    if (insertError) {
      console.error('Insert failed with error:', insertError)
    } else {
      console.log('Insert succeeded:', insertData)
      // Clean up test insert
      if (insertData && insertData.length > 0) {
        const deleteRes = await supabase
          .from('deposit_requests')
          .delete()
          .eq('id', insertData[0].id)
        console.log('Cleanup delete response error:', deleteRes.error)
      }
    }
  }
}

run()
