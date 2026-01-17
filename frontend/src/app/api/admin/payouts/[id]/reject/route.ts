import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdmin, validateWithdrawalRequest } from '@/lib/admin/validation'
import { logAdminAction, getClientIP, getUserAgent } from '@/lib/admin/audit-log'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const adminCheck = await validateAdmin()
    if (!adminCheck.isValid) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const requestId = params.id
    const body = await request.json()
    const { reason } = body

    // Validate withdrawal request exists and is pending
    const requestCheck = await validateWithdrawalRequest(requestId)
    if (!requestCheck.isValid) {
      return NextResponse.json(
        { error: requestCheck.error || 'Withdrawal request not found' },
        { status: requestCheck.error?.includes('already') ? 400 : 404 }
      )
    }

    const withdrawalRequest = requestCheck.request

    const supabase = await createClient()

    // Update withdrawal request status
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        admin_notes: reason || 'Rejected by admin',
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update withdrawal status: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Create notification for talent
    await supabase.from('notifications').insert({
      user_id: withdrawalRequest.talent_id,
      type: 'withdrawal_rejected',
      title: 'Withdrawal Declined',
      message: reason || 'Your withdrawal request has been declined. Please contact support.',
      data: { withdrawal_id: requestId }
    })

    // Log admin action
    await logAdminAction({
      admin_id: adminCheck.userId!,
      action: 'reject_withdrawal',
      resource_type: 'withdrawal',
      resource_id: requestId,
      details: {
        withdrawal_id: requestId,
        talent_id: withdrawalRequest.talent_id,
        reason: reason || 'Rejected by admin',
      },
      ip_address: getClientIP(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal rejected successfully',
    })
  } catch (error) {
    console.error('Error rejecting withdrawal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
