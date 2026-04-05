import { redirect } from 'next/navigation'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createClient } from '@/lib/supabase/server'
import { TalentWithMenu } from '@/types/database'
import { BrowseClient } from './BrowseClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Browse Talent - Nego',
    description: 'Discover and connect with verified talent on Nego - Premium Managed Talent Marketplace',
    url: `${APP_URL}/dashboard/browse`,
    type: 'website',
    pageType: 'dashboard',
})



export default async function BrowsePage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const params = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Parse filters from searchParams
    const q = params.q || ''
    const location = params.location && params.location !== 'All Locations' ? params.location : null
    const gender = params.gender && params.gender !== 'all' ? params.gender : null
    const status = params.status && params.status !== 'all' ? params.status : null
    const serviceId = params.service || null
    const sortBy = params.sort || 'random'
    const page = parseInt(params.page || '1')
    const limit = 20
    const offset = (page - 1) * limit

    // Base query
    let query = supabase
        .from('profiles')
        .select(`
            id,
            display_name,
            avatar_url,
            location,
            bio,
            status,
            is_verified,
            starting_price,
            created_at,
            username,
            role,
            full_name,
            updated_at,
            gender,
            talent_menus:talent_menus${serviceId ? '!inner' : ''} (
                id,
                talent_id,
                service_type_id,
                price,
                is_active,
                service_type:service_types (
                    id,
                    name,
                    icon
                )
            )
        `, { count: 'exact' })
        .eq('role', 'talent')

    // Apply filters
    if (q) {
        query = query.or(`display_name.ilike.%${q}%,username.ilike.%${q}%,location.ilike.%${q}%,bio.ilike.%${q}%`)
    }
    if (location) {
        query = query.eq('location', location)
    }
    if (gender) {
        query = query.eq('gender', gender)
    }
    if (status) {
        query = query.eq('status', status)
    }
    if (serviceId) {
        query = query.eq('talent_menus.service_type_id', serviceId)
        query = query.eq('talent_menus.is_active', true)
    }

    // Apply sorting
    if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'price_low') {
        query = query.order('starting_price', { ascending: true, nullsFirst: false })
    } else if (sortBy === 'price_high') {
        query = query.order('starting_price', { ascending: false, nullsFirst: false })
    } else {
        // Default: randomize within tiers (avatar first) or just recent
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: talents, count } = await query

    const resultTalents = talents as unknown as TalentWithMenu[]

    // Fetch service types for filter
    const { data: serviceTypes } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)

    return (
        <BrowseClient
            talents={resultTalents}
            serviceTypes={serviceTypes || []}
            userId={user.id}
            totalCount={count || 0}
            currentPage={page}
        />
    )
}
