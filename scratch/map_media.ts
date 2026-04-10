import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllFiles(bucket: string, folder: string = ''): Promise<string[]> {
    const allFiles: string[] = []
    
    const { data: items, error } = await supabase.storage.from(bucket).list(folder)
    
    if (error) {
        console.error(`Error listing folder ${folder}:`, error)
        return []
    }
    
    for (const item of items) {
        const itemPath = folder ? `${folder}/${item.name}` : item.name
        if (item.id) {
            // It's a file
            allFiles.push(itemPath)
        } else {
            // It's a folder (roughly, Supabase list is flat-ish but recursive-simulated)
            // If item.metadata is null and no id, it's likely a folder
            const subFiles = await listAllFiles(bucket, itemPath)
            allFiles.push(...subFiles)
        }
    }
    
    return allFiles
}

async function mapMedia() {
    console.log('--- Starting Media Mapping Audit ---')

    // 1. Get all profiles with role talent to verify IDs
    console.log('Fetching talent profiles...')
    const { data: talents, error: talentsError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'talent')
    
    if (talentsError) {
        console.error('Error fetching talents:', talentsError)
        return
    }
    const talentIds = new Set(talents.map(t => t.id))
    console.log(`Found ${talents.length} talents.`)

    // 2. Get all media database records
    console.log('Fetching media records from database...')
    const { data: dbMedia, error: dbError } = await supabase
        .from('media')
        .select('*')
    
    if (dbError) {
        console.error('Error fetching media records:', dbError)
        return
    }
    console.log(`Found ${dbMedia.length} media records in database.`)

    const dbUrls = new Set(dbMedia.map(m => m.url))

    // 3. List all files in 'media' storage bucket
    console.log('Listing files in storage bucket "media"... (this might take a while)')
    // Since recursive list can be slow/limit, let's try root folders first
    const { data: rootFolders, error: storageError } = await supabase.storage.from('media').list('')
    
    if (storageError) {
        console.error('Error listing storage:', storageError)
        return
    }

    const orphanFiles: { path: string, talentId: string, url: string }[] = []
    const mismatchedFiles: string[] = []

    for (const folder of rootFolders) {
        if (folder.id) {
            // File in root? Not expected based on our pattern
            console.log(`Unexpected file in root: ${folder.name}`)
            continue
        }

        const talentIdCandidate = folder.name
        console.log(`Processing folder for potential talent: ${talentIdCandidate}`)
        
        const files = await listAllFiles('media', talentIdCandidate)
        
        for (const filePath of files) {
            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)
            
            if (!dbUrls.has(publicUrl)) {
                if (talentIds.has(talentIdCandidate)) {
                    orphanFiles.push({
                        path: filePath,
                        talentId: talentIdCandidate,
                        url: publicUrl
                    })
                } else {
                    console.log(`File ${filePath} associated with unknown/non-talent ID: ${talentIdCandidate}`)
                }
            }
        }
    }

    console.log('\n--- Summary ---')
    console.log(`Total Orphan Files (in storage but not in DB, with valid talent ID): ${orphanFiles.length}`)
    
    if (orphanFiles.length > 0) {
        console.log('\nSample orphans:')
        orphanFiles.slice(0, 10).forEach(o => {
            console.log(`- Path: ${o.path}, Talent ID: ${o.talentId}`)
        })
        
        // Output as JSON for subsequent processing
        fs.writeFileSync('scratch/orphan_media.json', JSON.stringify(orphanFiles, null, 2))
        console.log('\nOrphan details saved to scratch/orphan_media.json')
    }
}

mapMedia()
