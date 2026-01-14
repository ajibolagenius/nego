'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gift, Coin, X, SpinnerGap, Check, Warning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface GiftCoinsProps {
  talentId: string
  talentName: string
  senderId: string
  senderBalance: number
  onSuccess?: () => void
}

const PRESET_AMOUNTS = [100, 500, 1000, 2500]
const MIN_GIFT_AMOUNT = 100

export function GiftCoins({ talentId, talentName, senderId, senderBalance, onSuccess }: GiftCoinsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState<number>(100)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const effectiveAmount = customAmount ? parseInt(customAmount) : amount
  const hasInsufficientBalance = effectiveAmount > senderBalance
  const isValidAmount = effectiveAmount >= MIN_GIFT_AMOUNT

  const handleGift = async () => {
    if (!isValidAmount) {
      setError(`Minimum gift amount is ${MIN_GIFT_AMOUNT} coins`)
      return
    }

    if (hasInsufficientBalance) {
      setError('Insufficient balance')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Deduct from sender's wallet
      const { error: deductError } = await supabase
        .from('wallets')
        .update({ balance: senderBalance - effectiveAmount })
        .eq('user_id', senderId)

      if (deductError) throw deductError

      // Add to recipient's wallet
      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', talentId)
        .single()

      const { error: addError } = await supabase
        .from('wallets')
        .update({ balance: (recipientWallet?.balance || 0) + effectiveAmount })
        .eq('user_id', talentId)

      if (addError) {
        // Rollback sender's wallet
        await supabase
          .from('wallets')
          .update({ balance: senderBalance })
          .eq('user_id', senderId)
        throw addError
      }

      // Create gift record
      const { error: giftError } = await supabase
        .from('gifts')
        .insert({
          sender_id: senderId,
          recipient_id: talentId,
          amount: effectiveAmount,
          message: message || null
        })

      if (giftError) {
        console.error('Gift record error:', giftError)
        // Continue anyway, the transfer was successful
      }

      // Create transaction records
      await supabase.from('transactions').insert([
        {
          user_id: senderId,
          amount: -effectiveAmount,
          coins: -effectiveAmount,
          type: 'gift',
          status: 'completed',
          description: `Gift to ${talentName}`
        },
        {
          user_id: talentId,
          amount: effectiveAmount,
          coins: effectiveAmount,
          type: 'gift',
          status: 'completed',
          description: `Gift received`
        }
      ])

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setAmount(100)
        setCustomAmount('')
        setMessage('')
        onSuccess?.()
      }, 2000)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send gift'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Gift Button */}
      <button
        onClick={() => setIsOpen(true)}
        data-testid="gift-coins-button"
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
      >
        <Gift size={20} weight="fill" />
        <span>Gift Coins</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden"
            data-testid="gift-coins-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Gift size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Send Gift</h2>
                  <p className="text-white/50 text-sm">to {talentName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check size={32} weight="bold" className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Gift Sent!</h3>
                  <p className="text-white/60">
                    You sent {effectiveAmount} coins to {talentName}
                  </p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Preset Amounts */}
                  <div>
                    <label className="block text-white/70 text-sm mb-3">Select Amount</label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_AMOUNTS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => { setAmount(preset); setCustomAmount('') }}
                          className={`py-3 rounded-xl font-bold text-sm transition-all ${
                            amount === preset && !customAmount
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Or Enter Custom Amount</label>
                    <div className="relative">
                      <Coin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder={`Min. ${MIN_GIFT_AMOUNT}`}
                        min={MIN_GIFT_AMOUNT}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    {customAmount && parseInt(customAmount) < MIN_GIFT_AMOUNT && (
                      <p className="text-red-400 text-xs mt-1">Minimum gift is {MIN_GIFT_AMOUNT} coins</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Add a Message (optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write a nice message..."
                      rows={2}
                      maxLength={200}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                    <p className="text-white/30 text-xs text-right mt-1">{message.length}/200</p>
                  </div>

                  {/* Balance Warning */}
                  <div className={`p-4 rounded-xl border ${
                    hasInsufficientBalance 
                      ? 'bg-amber-500/10 border-amber-500/20' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Coin size={24} weight="duotone" className={hasInsufficientBalance ? 'text-amber-400' : 'text-white/50'} />
                        <div>
                          <p className="text-white/50 text-xs">Your Balance</p>
                          <p className={`font-bold ${hasInsufficientBalance ? 'text-amber-400' : 'text-white'}`}>
                            {senderBalance.toLocaleString()} coins
                          </p>
                        </div>
                      </div>
                      {hasInsufficientBalance && (
                        <Link 
                          href="/dashboard/wallet" 
                          className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                        >
                          Top Up
                        </Link>
                      )}
                    </div>
                    {hasInsufficientBalance && (
                      <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-2">
                        <Warning size={16} className="text-amber-400" />
                        <p className="text-amber-400 text-sm">
                          You need <span className="font-bold">{effectiveAmount - senderBalance}</span> more coins
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="p-6 border-t border-white/10">
                <Button
                  onClick={handleGift}
                  disabled={loading || hasInsufficientBalance || !isValidAmount}
                  data-testid="send-gift-button"
                  className={`w-full font-bold py-4 rounded-xl disabled:opacity-50 ${
                    hasInsufficientBalance || !isValidAmount
                      ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                  }`}
                >
                  {loading ? (
                    <SpinnerGap size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Gift size={20} className="mr-2" />
                      Send {effectiveAmount} Coins
                    </>
                  )}
                </Button>
                <p className="text-white/40 text-xs text-center mt-3">
                  Gifts are non-refundable
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
