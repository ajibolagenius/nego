import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const targetUserIds = [
  '34515c64-c09f-4544-b745-b5c6c73a58b6',
  '5004efbd-49d0-4b85-a845-80c5d9a57a57',
  '5c02cbe1-b489-41be-b834-7fbae8e74d29',
  '6036c6ab-5db8-4541-ba08-419fb1584d42',
  '85eb576e-4e3e-4782-8cf0-7283c5e025b4',
  'a1587656-42be-45be-8288-cfd54e779588',
  'd0623001-b0ec-44bd-802f-6cefd94ecc2b',
  'f67e8254-0f1f-4346-8db6-ce51774f7a4b',
  'fc01b36e-6b36-4685-9a93-01506494202b'
]

async function run() {
  for (const userId of targetUserIds) {
    console.log(`\n=================== USER: ${userId} ===================`)
    
    // Fetch auth user
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)
    if (authError) {
      console.log(`Auth User Error: ${authError.message}`)
      continue
    }

    if (!user) {
      console.log('Auth User not found in auth.users!')
      continue
    }

    console.log(`Auth User: Email: ${user.email}, Created: ${user.created_at}`)

    // Check if profile exists for this ID
    const { data: profileById, error: pIdError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)

    console.log(`Profile by ID:`, profileById)

    // Check if profile exists for this email (under any ID)
    if (user.email) {
      const { data: profileByEmail, error: pEmailError } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .eq('email', user.email)

      console.log(`Profiles by Email (${user.email}):`, profileByEmail)
    }
  }
}

run()
