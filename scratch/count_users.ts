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
    perPage: 10000
  })

  if (authError) {
    console.error('Error listing auth users:', authError)
    return
  }

  console.log('Fetching profiles...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, created_at')

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return
  }

  const profileIds = new Set(profiles.map(p => p.id))
  
  let missingCount = 0
  let hasCount = 0
  
  const missingByDate: { [key: string]: number } = {}
  const hasByDate: { [key: string]: number } = {}

  for (const user of users) {
    const dateStr = user.created_at ? user.created_at.split('T')[0] : 'unknown'
    if (!profileIds.has(user.id)) {
      missingCount++
      missingByDate[dateStr] = (missingByDate[dateStr] || 0) + 1
    } else {
      hasCount++
      hasByDate[dateStr] = (hasByDate[dateStr] || 0) + 1
    }
  }

  console.log(`Total users in auth: ${users.length}`)
  console.log(`Total profiles: ${profiles.length}`)
  console.log(`Missing count: ${missingCount}`)
  console.log(`Has profile count: ${hasCount}`)
  
  console.log('Missing profiles by date:', missingByDate)
  console.log('Has profiles by date:', hasByDate)
}

run()
