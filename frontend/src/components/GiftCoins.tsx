'use client'

/**
 * GiftCoins Component
 *
 * A modal component that allows users to send coin gifts to talents.
 * Features:
 * - Preset amount buttons for quick selection
 * - Custom amount input with validation
 * - Optional message field
 * - Balance checking with top-up link
 * - Loading state and success animation
 * - Comprehensive error handling with user-friendly messages
 */

import { useState, useCallback } from 'react'
import { Gift, Coin, X, SpinnerGap, Check, Warning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GIFT_CONSTANTS, isValidUUID, isValidAmount } from '@/lib/gift-validation'

interface GiftCoinsProps {
    talentId: string
    talentName: string
    senderId: string
    senderBalance: number
    onSuccess?: () => void
}

interface GiftError {
    message: string
    field?: string
}

export function GiftCoins({
    talentId,
    talentName,
    senderId,
    senderBalance,
    onSuccess
}: GiftCoinsProps) {
    // Modal state
    const [isOpen, setIsOpen] = useState(false)

    // Form state
    const [selectedPreset, setSelectedPreset] = useState<number>(GIFT_CONSTANTS.PRESET_AMOUNTS[0])
    const [customAmount, setCustomAmount] = useState('')
    const [message, setMessage] = useState('')

    // UI state
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<GiftError | null>(null)
    const [success, setSuccess] = useState(false)

    // Calculate effective amount - prefer custom amount if entered
    const getEffectiveAmount = useCallback((): number => {
        if (customAmount.trim()) {
            const parsed = parseInt(customAmount, 10)
            return isNaN(parsed) ? 0 : Math.floor(parsed)
        }
        return selectedPreset
    }, [customAmount, selectedPreset])

    const effectiveAmount = getEffectiveAmount()
    const hasInsufficientBalance = effectiveAmount > senderBalance
    const isAmountValid = effectiveAmount >= GIFT_CONSTANTS.MIN_AMOUNT &&
        effectiveAmount <= GIFT_CONSTANTS.MAX_AMOUNT

    // Reset form state
    const resetForm = useCallback(() => {
        setSelectedPreset(GIFT_CONSTANTS.PRESET_AMOUNTS[0])
        setCustomAmount('')
        setMessage('')
        setError(null)
        setSuccess(false)
    }, [])

    // Handle modal open
    const openModal = useCallback(() => {
        resetForm()
        setIsOpen(true)
    }, [resetForm])

    // Handle modal close
    const closeModal = useCallback(() => {
        if (!loading) {
            setIsOpen(false)
            resetForm()
        }
    }, [loading, resetForm])

    // Handle preset selection
    const selectPreset = useCallback((amount: number) => {
        setSelectedPreset(amount)
        setCustomAmount('') // Clear custom amount when preset is selected
        setError(null)
    }, [])

    // Handle custom amount change
    const handleCustomAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '') // Only allow digits
        setCustomAmount(value)
        setError(null)
    }, [])

    // Handle message change
    const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value.slice(0, GIFT_CONSTANTS.MAX_MESSAGE_LENGTH)
        setMessage(value)
    }, [])

    // Validate inputs before sending
    const validateInputs = useCallback((): GiftError | null => {
        // Validate IDs
        if (!isValidUUID(senderId)) {
            return { message: 'Invalid session. Please refresh the page and try again.', field: 'senderId' }
        }
        if (!isValidUUID(talentId)) {
            return { message: 'Invalid talent profile. Please refresh the page and try again.', field: 'talentId' }
        }
        if (senderId === talentId) {
            return { message: 'You cannot send a gift to yourself.', field: 'talentId' }
        }

        // Validate amount
        if (!isAmountValid) {
            if (effectiveAmount < GIFT_CONSTANTS.MIN_AMOUNT) {
                return { message: `Minimum gift amount is ${GIFT_CONSTANTS.MIN_AMOUNT} coins`, field: 'amount' }
            }
            if (effectiveAmount > GIFT_CONSTANTS.MAX_AMOUNT) {
                return { message: `Maximum gift amount is ${GIFT_CONSTANTS.MAX_AMOUNT.toLocaleString()} coins`, field: 'amount' }
            }
            return { message: 'Please enter a valid gift amount', field: 'amount' }
        }

        // Validate balance
        if (hasInsufficientBalance) {
            return { message: 'Insufficient balance', field: 'balance' }
        }

        return null
    }, [senderId, talentId, effectiveAmount, isAmountValid, hasInsufficientBalance])

    // Handle gift submission
    const handleGift = async () => {
        // Clear previous error
        setError(null)

        // Validate inputs
        const validationError = validateInputs()
        if (validationError) {
            setError(validationError)
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/gifts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    senderId,
                    recipientId: talentId,
                    amount: effectiveAmount,
                    message: message.trim() || null,
                    senderName: 'Client',
                    recipientName: talentName,
                }),
            })

            // Handle 5xx server errors
            if (response.status >= 500) {
                console.error('[GiftCoins] Server error:', response.status, response.statusText)
                setError({
                    message: 'Server temporarily unavailable. Please try again in a moment.',
                    field: 'server'
                })
                setLoading(false)
                return
            }

            // Try to parse JSON response
            let data
            try {
                data = await response.json()
            } catch (parseError) {
                console.error('[GiftCoins] Failed to parse response:', parseError)
                setError({
                    message: 'Unexpected server response. Please try again.',
                    field: 'server'
                })
                setLoading(false)
                return
            }

            if (!response.ok) {
                // Handle specific error cases with clearer messages
                const errorMessage = data.error || 'Failed to send gift'
                const errorField = data.field

                // Provide more specific error messages
                if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
                    setError({ message: 'Insufficient balance. Please top up your wallet to send this gift.', field: 'balance' })
                } else if (errorMessage.includes('wallet')) {
                    setError({ message: 'Wallet not found. Please contact support for assistance.', field: 'wallet' })
                } else if (errorMessage.includes('pattern') || errorMessage.includes('format') || errorMessage.includes('constraint')) {
                    setError({ message: 'Invalid data format. Please refresh the page and try again.', field: errorField })
                } else if (errorMessage.includes('yourself')) {
                    setError({ message: 'You cannot send a gift to yourself.', field: 'recipientId' })
                } else if (errorMessage.includes('minimum') || errorMessage.includes('amount')) {
                    setError({ message: errorMessage, field: 'amount' })
                } else {
                    setError({ message: errorMessage, field: errorField })
                }
                setLoading(false)
                return
            }

            // Success!
            setSuccess(true)

            // Close modal and callback after animation
            setTimeout(() => {
                setIsOpen(false)
                resetForm()
                onSuccess?.()
            }, 2000)

        } catch (err) {
            console.error('[GiftCoins] Error sending gift:', err)

            // Handle network errors
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError({ message: 'Network error. Please check your connection and try again.' })
            } else {
                setError({ message: 'Something went wrong. Please try again.' })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Gift Button - Triggers modal */}
            <button
                onClick={openModal}
                data-testid="gift-coins-button"
                aria-label={`Send gift to ${talentName}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
            >
                <Gift size={20} weight="fill" aria-hidden="true" />
                <span>Gift Coins</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="gift-modal-title"
                >
                    {/* Modal Content */}
                    <div
                        className="bg-[#0a0a0f] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto my-auto"
                        data-testid="gift-coins-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                                    <Gift size={20} weight="fill" className="text-white" />
                                </div>
                                <div>
                                    <h2 id="gift-modal-title" className="text-xl font-bold text-white">Send Gift</h2>
                                    <p className="text-white/50 text-sm">to {talentName}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                disabled={loading}
                                className="text-white/60 hover:text-white disabled:opacity-50 transition-colors"
                                aria-label="Close gift modal"
                                title="Close"
                            >
                                <X size={24} aria-hidden="true" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {success ? (
                                /* Success State */
                                <div className="text-center py-8" data-testid="gift-success" role="status" aria-live="polite">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} weight="bold" className="text-green-400" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Gift Sent!</h3>
                                    <p className="text-white/60">
                                        You sent {effectiveAmount.toLocaleString()} coins to {talentName}
                                    </p>
                                    <span className="sr-only">Gift sent successfully</span>
                                </div>
                            ) : (
                                /* Form State */
                                <>
                                    {/* Error Display */}
                                    {error && (
                                        <div
                                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                                            data-testid="gift-error"
                                            role="alert"
                                        >
                                            {error.message}
                                        </div>
                                    )}

                                    {/* Preset Amount Buttons */}
                                    <div>
                                        <label className="block text-white/70 text-sm mb-3">Select Amount</label>
                                        <div className="grid grid-cols-5 gap-2" role="group" aria-label="Preset gift amounts">
                                            {GIFT_CONSTANTS.PRESET_AMOUNTS.map((preset) => {
                                                const isSelected = selectedPreset === preset && !customAmount.trim()
                                                return (
                                                    <button
                                                        key={preset}
                                                        onClick={() => selectPreset(preset)}
                                                        disabled={loading}
                                                        data-testid={`preset-amount-${preset}`}
                                                        aria-pressed={isSelected}
                                                        aria-label={`Select ${preset} coins`}
                                                        className={`py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${isSelected
                                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                                                            }`}
                                                    >
                                                        {preset >= 1000 ? `${preset / 1000}k` : preset}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Custom Amount Input */}
                                    <div>
                                        <label htmlFor="custom-amount" className="block text-white/70 text-sm mb-2">
                                            Or Enter Custom Amount
                                        </label>
                                        <div className="relative">
                                            <Coin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} aria-hidden="true" />
                                            <input
                                                id="custom-amount"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={customAmount}
                                                onChange={handleCustomAmountChange}
                                                disabled={loading}
                                                placeholder={`Min. ${GIFT_CONSTANTS.MIN_AMOUNT}`}
                                                autoComplete="off"
                                                aria-label="Enter custom gift amount"
                                                aria-describedby={customAmount && parseInt(customAmount, 10) < GIFT_CONSTANTS.MIN_AMOUNT ? "min-amount-warning" : undefined}
                                                data-testid="custom-amount-input"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                                            />
                                        </div>
                                        {customAmount && parseInt(customAmount, 10) < GIFT_CONSTANTS.MIN_AMOUNT && (
                                            <p id="min-amount-warning" className="text-amber-400 text-xs mt-1" role="alert">
                                                Minimum gift is {GIFT_CONSTANTS.MIN_AMOUNT} coins
                                            </p>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div>
                                        <label htmlFor="gift-message" className="block text-white/70 text-sm mb-2">
                                            Add a Message (optional)
                                        </label>
                                        <textarea
                                            id="gift-message"
                                            value={message}
                                            onChange={handleMessageChange}
                                            disabled={loading}
                                            placeholder="Write a nice message..."
                                            rows={2}
                                            maxLength={GIFT_CONSTANTS.MAX_MESSAGE_LENGTH}
                                            autoComplete="off"
                                            aria-label="Add an optional message with your gift"
                                            aria-describedby="message-length"
                                            data-testid="gift-message-input"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 resize-none disabled:opacity-50"
                                        />
                                        <p id="message-length" className="text-white/30 text-xs text-right mt-1" aria-live="polite">
                                            {message.length}/{GIFT_CONSTANTS.MAX_MESSAGE_LENGTH}
                                            <span className="sr-only">characters remaining</span>
                                        </p>
                                    </div>

                                    {/* Balance Display / Warning */}
                                    <div className={`p-4 rounded-xl border ${hasInsufficientBalance
                                            ? 'bg-amber-500/10 border-amber-500/20'
                                            : 'bg-white/5 border-white/10'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Coin
                                                    size={24}
                                                    weight="duotone"
                                                    className={hasInsufficientBalance ? 'text-amber-400' : 'text-white/50'}
                                                    aria-hidden="true"
                                                />
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
                                                    onClick={closeModal}
                                                    aria-label="Go to wallet to top up balance"
                                                >
                                                    Top Up
                                                </Link>
                                            )}
                                        </div>
                                        {hasInsufficientBalance && effectiveAmount > 0 && (
                                            <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-2">
                                                <Warning size={16} className="text-amber-400" aria-hidden="true" />
                                                <p className="text-amber-400 text-sm">
                                                    You need <span className="font-bold">{(effectiveAmount - senderBalance).toLocaleString()}</span> more coins
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer - Send Button */}
                        {!success && (
                            <div className="p-6 border-t border-white/10">
                                <Button
                                    onClick={handleGift}
                                    disabled={loading || hasInsufficientBalance || !isAmountValid}
                                    data-testid="send-gift-button"
                                    className={`w-full font-bold py-4 rounded-xl disabled:opacity-50 transition-all ${hasInsufficientBalance || !isAmountValid
                                            ? 'bg-white/10 text-white/50 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <SpinnerGap size={20} className="animate-spin" aria-hidden="true" />
                                            <span className="sr-only">Sending gift...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Gift size={20} className="mr-2" aria-hidden="true" />
                                            Send {effectiveAmount > 0 ? effectiveAmount.toLocaleString() : '0'} Coins
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
