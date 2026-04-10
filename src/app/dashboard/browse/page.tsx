import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/server'
import { ServiceType, TalentWithMenu } from '@/types/database'
import { BrowseClient } from './BrowseClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'
const BROWSE_PAGE_SIZE = 20

interface CachedBrowseResult {
    talents: TalentWithMenu[]
    totalCount: number
}

const getCachedBrowseResults = unstable_cache(
    async (
        q: string,
        location: string | null,
        gender: string | null,
        status: string | null,
        serviceId: string | null,
        sortBy: string,
        page: number,
        limit: number
    ): Promise<CachedBrowseResult> => {
        const supabase = createApiClient()
        const offset = (page - 1) * limit

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

        if (sortBy === 'recent') {
            query = query.order('created_at', { ascending: false })
        } else if (sortBy === 'price_low') {
            query = query.order('starting_price', { ascending: true, nullsFirst: false })
        } else if (sortBy === 'price_high') {
            query = query.order('starting_price', { ascending: false, nullsFirst: false })
        } else {
            query = query.order('created_at', { ascending: false })
        }

        const { data, count, error } = await query.range(offset, offset + limit - 1)

        if (error) {
            throw error
        }

        return {
            talents: (data ?? []) as unknown as TalentWithMenu[],
            totalCount: count ?? 0,
        }
    },
    ['browse-results'],
    { revalidate: 120 }
)

const getCachedServiceTypes = unstable_cache(
    async (): Promise<ServiceType[]> => {
        const supabase = createApiClient()
        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (error) {
            throw error
        }

        return data ?? []
    },
    ['browse-service-types'],
    { revalidate: 3600 }
)

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
    const parsedPage = Number.parseInt(params.page || '1', 10)
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

    const [{ talents, totalCount }, serviceTypes] = await Promise.all([
        getCachedBrowseResults(q, location, gender, status, serviceId, sortBy, page, BROWSE_PAGE_SIZE),
        getCachedServiceTypes(),
    ])

    return (
        <BrowseClient
            talents={talents}
            serviceTypes={serviceTypes}
            userId={user.id}
            totalCount={totalCount}
            currentPage={page}
        />
    )
}
