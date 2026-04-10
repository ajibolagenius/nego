import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectMedia() {
    console.log('--- Inspecting Media Table ---')
    const { data: media, error } = await supabase
        .from('media')
        .select('*')
        .limit(50)

    if (error) {
        console.error('Error fetching media:', error)
        return
    }

    console.log(`Found ${media.length} media records.`)
    media.forEach((m, i) => {
        console.log(`${i+1}. ID: ${m.id}, Talent ID: ${m.talent_id}, URL: ${m.url}`)
    })

    console.log('\n--- Inspecting Storage (Bucket: media) ---')
    // We can't easily list all files recursively through the client in one go without a loop per directory
    // but let's try to list the root to see folders (talent IDs)
    const { data: folders, error: storageError } = await supabase
        .storage
        .from('media')
        .list('', { limit: 100 })

    if (storageError) {
        console.error('Error listing storage:', storageError)
        return
    }

    console.log(`Found ${folders.length} items in 'media' bucket root.`)
    folders.forEach(f => {
        console.log(`- ${f.name} (${f.id ? 'File' : 'Folder'})`)
    })
}

inspectMedia()
