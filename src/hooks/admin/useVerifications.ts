'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Verification {
  id: string
  booking_id: string
  selfie_url: string | null
  full_name: string | null
  phone: string | null
  gps_coords: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  booking: any | null
}

export function useVerifications(initialVerifications: Verification[]) {
  const router = useRouter()
  const supabase = createClient()
  const [verifications, setVerifications] = useState<Verification[]>(initialVerifications)
  const [isProcessing, setIsProcessing] = useState(false)
  const verificationChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Real-time subscription
  useEffect(() => {
    if (verificationChannelRef.current) {
      supabase.removeChannel(verificationChannelRef.current)
    }

    const channel = supabase
      .channel('admin-verifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'verifications',
        },
        async () => {
          // Refetch verifications
          const { data: updatedVerifications } = await supabase
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

          if (updatedVerifications) {
            const transformed = updatedVerifications.map(v => ({
              ...v,
              id: v.booking_id,
            })) as Verification[]
            setVerifications(transformed)
          }
        }
      )
      .subscribe()

    verificationChannelRef.current = channel

    return () => {
      if (verificationChannelRef.current) {
        supabase.removeChannel(verificationChannelRef.current)
        verificationChannelRef.current = null
      }
    }
  }, [supabase])

  const approveVerification = async (verification: Verification, adminNotes?: string) => {
    setIsProcessing(true)
    try {
      const { error: verifyError } = await supabase
        .from('verifications')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
        })
        .eq('booking_id', verification.booking_id)

      if (verifyError) throw verifyError

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', verification.booking_id)

      if (bookingError) throw bookingError

      toast.success('Verification Approved', {
        description: 'Client verification has been approved and booking is now confirmed.'
      })

      router.refresh()
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve verification. Please try again.'
      toast.error('Approval Failed', { description: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      setIsProcessing(false)
    }
  }

  const rejectVerification = async (verification: Verification, adminNotes: string) => {
    setIsProcessing(true)
    try {
      // Get booking details for refund
      const { data: bookingData, error: bookingFetchError } = await supabase
        .from('bookings')
        .select('id, client_id, total_price, status')
        .eq('id', verification.booking_id)
        .single()

      if (bookingFetchError || !bookingData) {
        throw new Error('Unable to fetch booking details')
      }

      // Update verification
      const { error: verifyError } = await supabase
        .from('verifications')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
        })
        .eq('booking_id', verification.booking_id)

      if (verifyError) throw verifyError

      // Update booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', verification.booking_id)

      if (bookingError) throw bookingError

      // Refund coins
      if (bookingData.total_price > 0 && bookingData.client_id) {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', bookingData.client_id)
          .single()

        if (walletData) {
          await supabase
            .from('wallets')
            .update({ balance: (walletData.balance || 0) + bookingData.total_price })
            .eq('user_id', bookingData.client_id)

          await supabase.from('transactions').insert({
            user_id: bookingData.client_id,
            amount: 0,
            coins: bookingData.total_price,
            type: 'refund',
            status: 'completed',
            description: `Refund for rejected verification - Booking #${bookingData.id.slice(0, 8)}`,
            reference_id: bookingData.id
          })
        }
      }

      toast.success('Verification Rejected', {
        description: `Client verification has been rejected. ${bookingData.total_price > 0 ? `${bookingData.total_price.toLocaleString()} coins have been refunded.` : ''}`
      })

      router.refresh()
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject verification. Please try again.'
      toast.error('Rejection Failed', { description: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    verifications,
    isProcessing,
    approveVerification,
    rejectVerification,
  }
}
