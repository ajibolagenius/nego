import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  // Get exact count of profiles
  const { count: profileCount, error: profileErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  console.log('Exact Profiles Count:', profileCount, 'Error:', profileErr)

  // Let's count how many auth users there are
  // listUsers doesn't have an exact count query, but we can page through them or check if there is a profile for a specific user.
}

run()
