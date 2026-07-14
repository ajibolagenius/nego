import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const targetUserId = '02534252-8ca9-405e-82b6-3f16b63f7bbe'
  console.log(`Attempting to insert profile for user ${targetUserId}...`)
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: targetUserId,
      role: 'client',
      display_name: 'Jasmine Minor',
      username: null,
      avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocLuaS7DFFmYZHuFsm-FxyFb2pOeye89DdTA8MStVnPmT1JWBUY=s96-c',
      email: 'jasmineminor.abc7news@gmail.com'
    })
    .select()

  if (error) {
    console.error('Insert failed with error:', error)
  } else {
    console.log('Insert succeeded! Data:', data)
    
    // Clean it up
    await supabase.from('profiles').delete().eq('id', targetUserId)
    console.log('Cleaned up.')
  }
}

run()
