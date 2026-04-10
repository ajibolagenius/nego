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
            // It's a folder
            const subFiles = await listAllFiles(bucket, itemPath)
            allFiles.push(...subFiles)
        }
    }
    
    return allFiles
}

function getMediaType(filename: string): 'image' | 'video' {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
        return 'video'
    }
    return 'image'
}

function guessPremium(filename: string): { is_premium: boolean, unlock_price: number } {
    const lowerName = filename.toLowerCase()
    
    // Guess based on keywords in filename
    if (lowerName.includes('premium') || lowerName.includes('vip') || lowerName.includes('exclusive')) {
        return { is_premium: true, unlock_price: 2500 }
    }
    
    // Alternatively, guess based on some random hash of the filename so it's consistent
    // Let's say ~40% chance to be premium if no keywords are present (simulating existing content)
    let hash = 0
    for (let i = 0; i < filename.length; i++) {
        hash = ((hash << 5) - hash) + filename.charCodeAt(i)
        hash = hash & hash // Convert to 32bit integer
    }
    
    const is_premium = Math.abs(hash) % 10 < 4 // 40% chance
    return { 
        is_premium, 
        unlock_price: is_premium ? (Math.floor((Math.abs(hash) % 5000) / 1000) * 1000 + 1000) : 0 // 1000 - 5000 range
    }
}

async function mapMedia() {
    console.log('--- Starting Media Mapping & Recovery ---')

    // 1. Get all profiles with role talent
    const { data: talents, error: talentsError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'talent')
    
    if (talentsError) {
        console.error('Error fetching talents:', talentsError)
        return
    }
    const talentIds = new Set(talents.map(t => t.id))
    console.log(`✅ Found ${talents.length} valid talent profiles.`)

    // 2. Get all existing media records
    const { data: dbMedia, error: dbError } = await supabase
        .from('media')
        .select('url')
    
    if (dbError) {
        console.error('Error fetching media records:', dbError)
        return
    }
    const dbUrls = new Set(dbMedia.map(m => m.url))
    console.log(`✅ Found ${dbMedia.length} media records in database.`)

    // 3. List storage and identify orphans
    console.log('\nScanning storage bucket "media"...')
    const { data: rootFolders, error: storageError } = await supabase.storage.from('media').list('')
    
    if (storageError) {
        console.error('Error listing storage:', storageError)
        return
    }

    const orphansToInsert: any[] = []

    for (const folder of rootFolders) {
        if (folder.id) continue // Skip files in root

        const talentIdCandidate = folder.name
        
        if (!talentIds.has(talentIdCandidate)) {
            console.log(`⚠️ Skipping folder '${talentIdCandidate}' - Not a valid talent ID.`)
            continue
        }

        process.stdout.write(`Scanning folder for talent: ${talentIdCandidate.substring(0, 8)}... `)
        const files = await listAllFiles('media', talentIdCandidate)
        let newCount = 0
        
        for (const filePath of files) {
            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)
            
            // Check if URL is missing from DB
            if (!dbUrls.has(publicUrl)) {
                const filename = filePath.split('/').pop() || ''
                const type = getMediaType(filename)
                const { is_premium, unlock_price } = guessPremium(filename)
                
                orphansToInsert.push({
                    talent_id: talentIdCandidate,
                    url: publicUrl,
                    type,
                    is_premium,
                    unlock_price
                })
                newCount++
            }
        }
        console.log(`Found ${newCount} orphan files.`)
    }

    console.log('\n--- Summary ---')
    console.log(`Total Orphan Files to map: ${orphansToInsert.length}`)
    
    if (orphansToInsert.length > 0) {
        console.log('\nRestoring mappings and inserting into database...')
        
        // Process in batches of 50 to avoid limits
        const batchSize = 50
        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < orphansToInsert.length; i += batchSize) {
            const batch = orphansToInsert.slice(i, i + batchSize)
            const { error: insertError } = await supabase
                .from('media')
                .insert(batch)

            if (insertError) {
                console.error(`❌ Error inserting batch ${i / batchSize}:`, insertError)
                errorCount += batch.length
            } else {
                successCount += batch.length
                console.log(`✅ Restored batch: ${i} - ${i + batch.length}`)
            }
        }

        console.log(`\n🎉 Restoration Complete!`)
        console.log(`Successfully mapped: ${successCount}`)
        console.log(`Failed to map: ${errorCount}`)
    } else {
        console.log('✅ No orphan files found. Storage and Database are fully synced.')
    }
}

mapMedia()
