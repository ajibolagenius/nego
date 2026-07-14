import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const email = 'jasmineminor.abc7news@gmail.com'
  console.log(`Checking profiles and auth users with email: ${email}`)

  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .eq('email', email)

  console.log('Profiles with email:', profiles, pError)

  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers()
  const authUsersWithEmail = users.filter(u => u.email === email)
  
  console.log('Auth users with email:', authUsersWithEmail.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })))
}

run()
