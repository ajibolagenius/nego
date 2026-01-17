import { createApiClient } from '@/lib/supabase/api'
import { VerificationsClient } from './VerificationsClient'
import type { VerificationWithBooking } from '@/types/admin'

export const metadata = {
  title: 'Verifications - Nego Admin',
  description: 'Review and manage client verifications',
}

export default async function VerificationsPage() {
  // Use API client (service role) to bypass RLS for admin operations
  const supabase = createApiClient()

  // Fetch all verifications with booking and client details
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

  // Log errors for debugging
  if (error) {
    console.error('[VerificationsPage] Error fetching verifications:', error)
  }

  // Transform data to include id field (use booking_id as id)
  const transformedVerifications: VerificationWithBooking[] = (verifications || []).map(v => ({
    ...v,
    id: v.booking_id, // Use booking_id as unique identifier
  }))

  console.log('[VerificationsPage] Loaded verifications:', transformedVerifications.length)

  return <VerificationsClient verifications={transformedVerifications} />
}
