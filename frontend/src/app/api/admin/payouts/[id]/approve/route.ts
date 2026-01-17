import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAdmin, validateWithdrawalRequest, validateWalletBalance } from '@/lib/admin/validation'
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

    // Validate withdrawal request exists and is pending
    const requestCheck = await validateWithdrawalRequest(requestId)
    if (!requestCheck.isValid) {
      return NextResponse.json(
        { error: requestCheck.error || 'Withdrawal request not found' },
        { status: requestCheck.error?.includes('already') ? 400 : 404 }
      )
    }

    const withdrawalRequest = requestCheck.request

    // Validate wallet balance
    const balanceCheck = await validateWalletBalance(
      withdrawalRequest.talent_id,
      withdrawalRequest.amount
    )

    if (!balanceCheck.isValid) {
      return NextResponse.json(
        { error: balanceCheck.error || 'Insufficient balance' },
        { status: 400 }
      )
    }

    const currentBalance = balanceCheck.currentBalance!
    const newBalance = currentBalance - withdrawalRequest.amount

    const supabase = await createClient()

    // Deduct from wallet first using atomic update (optimistic locking)
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', withdrawalRequest.talent_id)
      .eq('balance', currentBalance) // Ensure balance hasn't changed

    if (walletError) {
      return NextResponse.json(
        { error: 'Failed to update wallet balance. The wallet may have been modified. Please refresh and try again.' },
        { status: 409 } // Conflict
      )
    }

    // Update withdrawal request status
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      // Rollback wallet update
      await supabase
        .from('wallets')
        .update({ balance: currentBalance })
        .eq('user_id', withdrawalRequest.talent_id)

      return NextResponse.json(
        { error: `Failed to update withdrawal status: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Create notification for talent
    await supabase.from('notifications').insert({
      user_id: withdrawalRequest.talent_id,
      type: 'withdrawal_approved',
      title: 'Withdrawal Approved!',
      message: `Your withdrawal request for ${withdrawalRequest.amount.toLocaleString()} coins has been approved.`,
      data: { withdrawal_id: requestId, amount: withdrawalRequest.amount }
    })

    // Log admin action
    await logAdminAction({
      admin_id: adminCheck.userId!,
      action: 'approve_withdrawal',
      resource_type: 'withdrawal',
      resource_id: requestId,
      details: {
        withdrawal_id: requestId,
        talent_id: withdrawalRequest.talent_id,
        amount: withdrawalRequest.amount,
        new_balance: newBalance,
      },
      ip_address: getClientIP(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal approved successfully',
      newBalance,
    })
  } catch (error) {
    console.error('Error approving withdrawal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
