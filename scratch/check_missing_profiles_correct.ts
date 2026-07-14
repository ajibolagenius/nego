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
    console.log(`Fetched ${allProfileIds.size} profiles so far...`)
    
    if (data.length < pageSize) break
    page++
  }

  console.log(`Total profiles in DB: ${allProfileIds.size}`)

  console.log('Fetching auth users...')
  let allUsers: any[] = []
  let nextOffset: string | undefined = undefined
  let pageNum = 1
  
  while (true) {
    const { data: { users, nextRow }, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
      page: pageNum
    })

    if (authError) {
      console.error('Error listing auth users:', authError)
      return
    }

    if (!users || users.length === 0) break

    allUsers = allUsers.concat(users)
    console.log(`Fetched ${allUsers.length} auth users so far...`)
    
    if (users.length < 1000) break
    pageNum++
  }

  console.log(`Total users in auth: ${allUsers.length}`)

  const missingProfiles = []
  for (const user of allUsers) {
    if (!allProfileIds.has(user.id)) {
      missingProfiles.push({
        id: user.id,
        email: user.email,
        created_at: user.created_at
      })
    }
  }

  console.log(`Real count of users missing profiles: ${missingProfiles.length}`)
  
  if (missingProfiles.length > 0) {
    console.log('Sample of real missing profiles (first 10):')
    missingProfiles.slice(0, 10).forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`)
    })
  }

  // Let's check our 27 user ID folders from storage that were "missing profiles"!
  const storageFolders = [
    '050ecb58-e376-410a-9484-4b51c0ccc08b',
    '0cf545af-f591-4ec6-ae63-7ef7ccdfbe39',
    '1c58b759-4671-4f95-ae23-3214076f1501',
    '1f453c10-605c-498c-8821-9da49ad6f469',
    '2c2a0e91-aa9d-4d64-ae77-5c7a2c3ba372',
    '34515c64-c09f-4544-b745-b5c6c73a58b6',
    '40ac5135-e4cc-41b0-a164-f519555c0a05',
    '496f7bb4-2fc1-4665-8baf-31bd3dd2ac76',
    '5004efbd-49d0-4b85-a845-80c5d9a57a57',
    '504017e7-56ea-4a26-8ab3-66429bc8897e',
    '58770c7d-46a3-47c6-b68d-2534f4e866a3',
    '5c02cbe1-b489-41be-b834-7fbae8e74d29',
    '6036c6ab-5db8-4541-ba08-419fb1584d42',
    '66ef979e-f04f-40c9-8488-c3cf0b39ef99',
    '83069638-c618-4be2-b9d9-8c36856a4b8d',
    '842c1ed0-e932-4bff-b31a-241ad1ee4a90',
    '85eb576e-4e3e-4782-8cf0-7283c5e025b4',
    '92c5a91f-0469-4305-8fad-3ef5e09a482a',
    'a1587656-42be-45be-8288-cfd54e779588',
    'a2119870-ed14-4fea-a88f-d2a6cd085a55',
    'acb2bb24-a1cc-49d3-8e96-2baea3ee1601',
    'd0623001-b0ec-44bd-802f-6cefd94ecc2b',
    'd2b4c010-d098-4d67-9e8a-6bfd9406b69d',
    'db6d3d64-7e7f-40d7-8cd0-821a93585ceb',
    'f1833701-840c-45f1-9cb9-c2d2b2e2a3e6',
    'f67e8254-0f1f-4346-8db6-ce51774f7a4b',
    'fc01b36e-6b36-4685-9a93-01506494202b'
  ]

  console.log('\nChecking our 27 folders again against the full profile ID set:')
  const realMissingFolders = []
  for (const folder of storageFolders) {
    if (!allProfileIds.has(folder)) {
      realMissingFolders.push(folder)
    }
  }

  console.log(`Real missing profile folders count: ${realMissingFolders.length}`)
  console.log('Real missing folders:', realMissingFolders)
}

run()
