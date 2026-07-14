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
    perPage: 1000
  })

  if (authError) {
    console.error('Error listing auth users:', authError)
    return
  }

  console.log('Fetching profiles...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, role')

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return
  }

  const profileIds = new Set(profiles.map(p => p.id))
  const missingProfiles = []

  for (const user of users) {
    if (!profileIds.has(user.id)) {
      missingProfiles.push({
        id: user.id,
        email: user.email,
        created_at: user.created_at
      })
    }
  }

  console.log(`Total auth users: ${users.length}`)
  console.log(`Total profiles: ${profiles.length}`)
  console.log(`Users missing profiles:`, missingProfiles)
}

run()
