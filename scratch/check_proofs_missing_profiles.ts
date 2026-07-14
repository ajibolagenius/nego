import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('Listing folders in payment_proofs storage bucket...')
  
  // List folders in payment_proofs bucket
  // We can list objects at root
  const { data: objects, error: storageError } = await supabase.storage
    .from('payment_proofs')
    .list()

  if (storageError) {
    console.error('Error listing storage objects:', storageError)
    return
  }

  console.log(`Found ${objects?.length || 0} objects/folders at the root of payment_proofs.`)

  if (!objects || objects.length === 0) return

  // Filter folders (these are user IDs)
  // Note: in Supabase storage, folders are objects without metadata/id or with name containing the user ID
  const folders = objects.map(o => o.name)
  console.log('User ID folders in storage:', folders)

  // Now, let's check which of these user IDs do not have profiles in profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')

  if (profileError) {
    console.error('Error fetching profiles:', profileError)
    return
  }

  const profileIds = new Set(profiles.map(p => p.id))
  
  const foldersMissingProfiles = []
  for (const folder of folders) {
    if (!profileIds.has(folder)) {
      foldersMissingProfiles.push(folder)
    }
  }

  console.log(`Folders/User IDs missing profiles:`, foldersMissingProfiles)

  if (foldersMissingProfiles.length > 0) {
    // Get auth user details for these folders
    for (const userId of foldersMissingProfiles) {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
      if (user) {
        console.log(`User ID: ${userId}, Email: ${user.email}, Created At: ${user.created_at}`)
      } else {
        console.log(`User ID: ${userId}, User Error:`, userError?.message)
      }
    }
  }
}

run()
