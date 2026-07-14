import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('Fetching all profiles with pagination...')
  const allProfileIds = new Set<string>()
  let page = 0
  const pageSize = 1000
  
  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('Error fetching profiles:', error)
      return
    }

    if (!data || data.length === 0) break
    data.forEach(p => allProfileIds.add(p.id))
    if (data.length < pageSize) break
    page++
  }

  console.log('Fetching auth users...')
  let allUsers: any[] = []
  let pageNum = 1
  
  while (true) {
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
      page: pageNum
    })

    if (authError) {
      console.error('Error listing auth users:', authError)
      return
    }

    if (!users || users.length === 0) break
    allUsers = allUsers.concat(users)
    if (users.length < 1000) break
    pageNum++
  }

  const missingByDate: { [key: string]: number } = {}
  let totalMissing = 0

  for (const user of allUsers) {
    if (!allProfileIds.has(user.id)) {
      totalMissing++
      const dateStr = user.created_at ? user.created_at.split('T')[0] : 'unknown'
      missingByDate[dateStr] = (missingByDate[dateStr] || 0) + 1
    }
  }

  console.log(`Total users: ${allUsers.length}`)
  console.log(`Total profiles: ${allProfileIds.size}`)
  console.log(`Real count of missing profiles: ${totalMissing}`)
  console.log('Real missing profiles by date:', JSON.stringify(missingByDate, null, 2))
}

run()
