import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import { VerificationsClient } from './VerificationsClient'
import type { VerificationWithBooking, BookingWithRelations } from '@/types/admin'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Verifications - Nego Admin',
    description: 'Review and manage client verifications',
    url: `${APP_URL}/admin/verifications`,
    type: 'website',
    pageType: 'admin',
})

export default async function VerificationsPage() {
    // Use API client (service role) to bypass RLS for admin operations
    const supabase = createApiClient()

    // Fetch verifications with booking and client details
    // Note: Client-side pagination handles the display, but we fetch a reasonable amount
    // to avoid loading too much data at once
    const { data: verifications, error } = await supabase
        .from('verifications')
        .select(`
      booking_id,
      selfie_url,
      full_name,
      phone,
      gps_coords,
      status,
      admin_notes,
      created_at,
      booking:bookings (
        id,
        total_price,
        status,
        created_at,
        client:profiles!bookings_client_id_fkey (
          id,
          display_name,
          email:full_name,
          avatar_url
        ),
        talent:profiles!bookings_talent_id_fkey (
          id,
          display_name
        )
      )
    `)
        .order('created_at', { ascending: false })
        .limit(1000) // Reasonable limit for client-side pagination

    // Log errors for debugging
    if (error) {
        console.error('[VerificationsPage] Error fetching verifications:', error)
    }

    // Transform data to include id field (use booking_id as id)
    // Handle booking as array (from join) or single object
    // Type assertion needed because Supabase returns arrays for joined relations
    // Define the type for the raw verification data from Supabase
    interface RawVerification {
        booking_id: string
        selfie_url: string
        full_name: string
        phone: string
        status: 'pending' | 'verified' | 'rejected'
        admin_notes: string | null
        created_at: string
        gps_coords: unknown // PostGIS types can be complex, keeping strictness relaxed here for now if needed, or string
        booking: {
            id: string
            total_price: number
            status: string
            created_at: string
            client: {
                id: string
                display_name: string
                full_name: string
                avatar_url: string
            } | {
                id: string
                display_name: string
                full_name: string
                avatar_url: string
            }[]
            talent: {
                id: string
                display_name: string
            } | {
                id: string
                display_name: string
            }[]
        } | {
            id: string
            total_price: number
            status: string
            created_at: string
            client: unknown
            talent: unknown
        }[]
    }

    const transformedVerifications: VerificationWithBooking[] = (verifications || []).map((v: RawVerification) => {
        // Supabase returns booking as array due to join, get first element
        const bookingArray = Array.isArray(v.booking) ? v.booking : (v.booking ? [v.booking] : [])
        const booking = bookingArray[0] || null

        if (!booking) {
            return {
                ...v,
                id: v.booking_id,
                booking: null,
            } as VerificationWithBooking
        }

        // Handle client and talent which may also be arrays
        const clientArray = Array.isArray(booking.client) ? booking.client : (booking.client ? [booking.client] : [])
        const talentArray = Array.isArray(booking.talent) ? booking.talent : (booking.talent ? [booking.talent] : [])

        return {
            ...v,
            id: v.booking_id, // Use booking_id as unique identifier
            booking: {
                ...booking,
                client: clientArray[0] || null,
                talent: talentArray[0] || null,
            } as BookingWithRelations,
        } as VerificationWithBooking
    })

    console.log('[VerificationsPage] Loaded verifications:', transformedVerifications.length)

    return <VerificationsClient verifications={transformedVerifications} />
}
