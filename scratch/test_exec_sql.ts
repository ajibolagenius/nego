import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  // Let's try calling different common names for SQL execution RPCs
  const commonRpcs = ['exec_sql', 'execute_sql', 'run_sql', 'query']
  
  for (const rpc of commonRpcs) {
    try {
      const { data, error } = await supabase.rpc(rpc, { sql: 'SELECT 1 as val;' })
      console.log(`RPC ${rpc} response:`, { data, error })
    } catch (err: any) {
      console.log(`RPC ${rpc} catch error:`, err.message)
    }
  }
}

run()
