import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('Fetching auth users...')
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 100
  })

  if (authError) {
    console.error('Error listing auth users:', authError)
    return
  }

  console.log('Fetching profiles...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return
  }

  const profileIds = new Set(profiles.map(p => p.id))
  
  const usersMissingProfile = users.filter(u => !profileIds.has(u.id))
  console.log(`Found ${usersMissingProfile.length} users missing profiles in the first 100.`)

  usersMissingProfile.slice(0, 10).forEach(u => {
    console.log(`User ID: ${u.id}`)
    console.log(`Email: ${u.email}`)
    console.log(`Created At: ${u.created_at}`)
    console.log(`user_metadata:`, JSON.stringify(u.user_metadata, null, 2))
    console.log(`raw_user_meta_data (if any):`, JSON.stringify((u as any).raw_user_meta_data, null, 2))
    console.log('-------------------------------------------')
  })
}

run()
