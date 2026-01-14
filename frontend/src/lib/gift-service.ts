/**
 * Gift Service
 * 
 * Server-side service for handling gift transactions.
 * This service encapsulates all gift-related database operations.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface GiftTransactionParams {
  senderId: string
  recipientId: string
  amount: number
  message: string | null
  senderName: string
  recipientName: string
}

export interface GiftTransactionResult {
  success: boolean
  error?: string
  newSenderBalance?: number
  giftId?: string
}

/**
 * Execute a gift transaction with proper error handling and rollback
 */
export async function executeGiftTransaction(
  supabase: SupabaseClient,
  params: GiftTransactionParams
): Promise<GiftTransactionResult> {
  const { senderId, recipientId, amount, message, senderName, recipientName } = params

  // Step 1: Get sender's wallet
  const { data: senderWallet, error: senderWalletError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', senderId)
    .single()

  if (senderWalletError) {
    console.error('[Gift] Sender wallet lookup error:', senderWalletError)
    return { success: false, error: 'Your wallet was not found. Please try again.' }
  }

  if (!senderWallet) {
    return { success: false, error: 'Your wallet was not found. Please contact support.' }
  }

  // Step 2: Check sender balance
  if (senderWallet.balance < amount) {
    return { 
      success: false, 
      error: `Insufficient balance. You have ${senderWallet.balance} coins but tried to send ${amount}.` 
    }
  }

  // Step 3: Get or verify recipient wallet exists
  const { data: recipientWallet, error: recipientWalletError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', recipientId)
    .single()

  if (recipientWalletError && recipientWalletError.code !== 'PGRST116') {
    // PGRST116 = row not found, which we can handle
    console.error('[Gift] Recipient wallet lookup error:', recipientWalletError)
    return { success: false, error: 'Recipient wallet could not be verified.' }
  }

  // If recipient wallet doesn't exist, create it
  if (!recipientWallet) {
    const { error: createWalletError } = await supabase
      .from('wallets')
      .insert({ user_id: recipientId, balance: 0, escrow_balance: 0 })

    if (createWalletError) {
      console.error('[Gift] Failed to create recipient wallet:', createWalletError)
      return { success: false, error: 'Could not initialize recipient wallet.' }
    }
  }

  const currentRecipientBalance = recipientWallet?.balance || 0
  const newSenderBalance = senderWallet.balance - amount
  const newRecipientBalance = currentRecipientBalance + amount

  // Step 4: Deduct from sender (using atomic update)
  const { error: deductError } = await supabase
    .from('wallets')
    .update({ balance: newSenderBalance })
    .eq('user_id', senderId)
    .gte('balance', amount) // Additional safety: only update if balance is sufficient

  if (deductError) {
    console.error('[Gift] Failed to deduct from sender:', deductError)
    return { success: false, error: 'Failed to process gift. Please try again.' }
  }

  // Step 5: Credit recipient
  const { error: creditError } = await supabase
    .from('wallets')
    .update({ balance: newRecipientBalance })
    .eq('user_id', recipientId)

  if (creditError) {
    console.error('[Gift] Failed to credit recipient:', creditError)
    // Rollback sender deduction
    await supabase
      .from('wallets')
      .update({ balance: senderWallet.balance })
      .eq('user_id', senderId)
    return { success: false, error: 'Failed to credit recipient. Your coins have been restored.' }
  }

  // Step 6: Create gift record
  let giftId: string | undefined
  const { data: giftRecord, error: giftRecordError } = await supabase
    .from('gifts')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      amount,
      message: message || null,
    })
    .select('id')
    .single()

  if (giftRecordError) {
    console.warn('[Gift] Failed to create gift record (non-critical):', giftRecordError)
    // Don't fail the transaction for this
  } else {
    giftId = giftRecord?.id
  }

  // Step 7: Create transaction records (non-critical)
  try {
    await supabase.from('transactions').insert([
      {
        user_id: senderId,
        amount: -amount,
        coins: -amount,
        type: 'gift',
        status: 'completed',
        description: `Gift to ${recipientName}`,
        reference_id: giftId || null,
      },
      {
        user_id: recipientId,
        amount: amount,
        coins: amount,
        type: 'gift',
        status: 'completed',
        description: `Gift from ${senderName}`,
        reference_id: giftId || null,
      },
    ])
  } catch (txError) {
    console.warn('[Gift] Failed to create transaction records (non-critical):', txError)
  }

  // Step 8: Create notification (non-critical)
  try {
    const notificationMessage = message 
      ? `${senderName} sent you ${amount} coins with a message: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`
      : `${senderName} sent you ${amount} coins`

    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'general',
      title: 'You received a gift! 🎁',
      message: notificationMessage,
      data: {
        gift_id: giftId,
        gift_amount: amount,
        sender_id: senderId,
        sender_name: senderName,
      },
    })
  } catch (notifError) {
    console.warn('[Gift] Failed to create notification (non-critical):', notifError)
  }

  return {
    success: true,
    newSenderBalance,
    giftId,
  }
}
