'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, User, ChatCircle, PaperPlaneTilt, SpinnerGap, X, Warning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Review, Profile } from '@/types/database'

interface ReviewCardProps {
    review: Review & { client?: Profile }
    currentUserId?: string
    isTalentOwner?: boolean
    onResponseSubmit?: (reviewId: string, response: string) => void
}

export function ReviewCard({ review, currentUserId, isTalentOwner, onResponseSubmit }: ReviewCardProps) {
    const [showResponseForm, setShowResponseForm] = useState(false)
    const [response, setResponse] = useState(review.talent_response || '')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleSubmitResponse = async () => {
        if (!response.trim()) {
            setError('Response cannot be empty')
            return
        }

        if (response.length > 500) {
            setError('Response must be 500 characters or less')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const supabase = createClient()
            const { error: updateError } = await supabase
                .from('reviews')
                .update({
                    talent_response: response.trim(),
                    talent_responded_at: new Date().toISOString()
                })
                .eq('id', review.id)

            if (updateError) {
                console.error('[ReviewCard] Error submitting response:', updateError)
                throw new Error('Failed to submit response. Please try again.')
            }

            setShowResponseForm(false)
            setResponse('')
            onResponseSubmit?.(review.id, response.trim())
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit response. Please try again.'
            setError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                    {review.client?.avatar_url ? (
                        <Image
                            src={review.client.avatar_url}
                            alt={review.client.display_name || 'User'}
                            width={40}
                            height={40}
                            sizes="40px"
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User size={20} weight="duotone" className="text-white/40" aria-hidden="true" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-white font-medium truncate">
                            {review.client?.display_name || 'Anonymous'}
                        </p>
                        <span className="text-white/40 text-xs shrink-0">
                            {formatDate(review.created_at)}
                        </span>
                    </div>

                    {/* Stars - Improved display */}
                    <div className="flex items-center gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={16}
                                weight={star <= review.rating ? 'fill' : 'regular'}
                                className={`transition-colors ${star <= review.rating ? 'text-amber-400' : 'text-white/20'
                                    }`}
                                aria-hidden="true"
                            />
                        ))}
                        <span className="text-white/60 text-sm ml-1 font-medium">
                            {review.rating}.0
                        </span>
                    </div>
                </div>
            </div>

            {/* Comment */}
            {review.comment ? (
                <p className="text-white/70 text-sm leading-relaxed mb-3">
                    {review.comment}
                </p>
            ) : (
                <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white/40 text-sm italic">No comment provided</p>
                </div>
            )}

            {/* Talent Response - Enhanced styling */}
            {review.talent_response && (
                <div className="mt-4 pl-4 border-l-2 border-[#df2531]/30 bg-[#df2531]/5 rounded-r-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <ChatCircle size={16} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                        <span className="text-[#df2531] text-xs font-semibold">Talent Response</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">
                        {review.talent_response}
                    </p>
                    {review.talent_responded_at && (
                        <span className="text-white/40 text-xs mt-2 block">
                            {formatDate(review.talent_responded_at)}
                        </span>
                    )}
                </div>
            )}

            {/* Response Form (for talent) */}
            {isTalentOwner && !review.talent_response && (
                <>
                    {showResponseForm ? (
                        <div className="mt-4 space-y-3">
                            <div>
                                <label htmlFor={`response-${review.id}`} className="block text-white/70 text-sm mb-2">
                                    Write your response
                                </label>
                                <textarea
                                    id={`response-${review.id}`}
                                    value={response}
                                    onChange={(e) => {
                                        setResponse(e.target.value)
                                        setError(null)
                                    }}
                                    placeholder="Write your response..."
                                    maxLength={500}
                                    rows={3}
                                    aria-label="Review response"
                                    aria-invalid={error ? 'true' : 'false'}
                                    aria-describedby={error ? `response-error-${review.id}` : `response-help-${review.id}`}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 text-sm resize-none transition-colors"
                                />
                                <div className="flex items-center justify-between mt-1">
                                    <p id={`response-help-${review.id}`} className="text-white/40 text-xs">
                                        {response.length}/500 characters
                                    </p>
                                    {error && (
                                        <p id={`response-error-${review.id}`} className="text-red-400 text-xs flex items-center gap-1" role="alert">
                                            <Warning size={12} aria-hidden="true" />
                                            {error}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowResponseForm(false)
                                        setResponse(review.talent_response || '')
                                        setError(null)
                                    }}
                                    className="border-white/20 text-white hover:bg-white/10 transition-colors"
                                    aria-label="Cancel response"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSubmitResponse}
                                    disabled={isSubmitting || !response.trim() || response.length > 500}
                                    className="bg-[#df2531] hover:bg-[#c41f2a] text-white transition-colors disabled:opacity-50"
                                    aria-label="Submit response"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <SpinnerGap size={16} className="animate-spin mr-1" aria-hidden="true" />
                                            <span className="sr-only">Submitting...</span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <PaperPlaneTilt size={16} weight="duotone" className="mr-1" aria-hidden="true" />
                                            Reply
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowResponseForm(true)}
                            className="mt-3 flex items-center gap-2 text-[#df2531] text-sm hover:text-[#c41f2a] transition-colors font-medium"
                            aria-label="Respond to review"
                        >
                            <ChatCircle size={16} weight="duotone" aria-hidden="true" />
                            Respond to review
                        </button>
                    )}
                </>
            )}
        </div>
    )
}

// Review Summary Component
interface ReviewSummaryProps {
    averageRating: number
    totalReviews: number
    ratingDistribution?: Record<number, number>
}

export function ReviewSummary({ averageRating, totalReviews, ratingDistribution }: ReviewSummaryProps) {
    const distribution = ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    return (
        <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#df2531]/30 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                {/* Average Rating - Enhanced */}
                <div className="text-center sm:text-left">
                    <div className="flex items-baseline justify-center sm:justify-start gap-2 mb-2">
                        <p className="text-5xl sm:text-6xl font-black text-white">
                            {averageRating.toFixed(1)}
                        </p>
                        <span className="text-white/40 text-lg">/ 5</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={20}
                                weight={star <= Math.round(averageRating) ? 'fill' : 'regular'}
                                className={`transition-colors ${star <= Math.round(averageRating) ? 'text-amber-400' : 'text-white/20'
                                    }`}
                                aria-hidden="true"
                            />
                        ))}
                    </div>
                    <p className="text-white/50 text-sm font-medium">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
                </div>

                {/* Rating Distribution - Enhanced with gradients */}
                <div className="flex-1 space-y-2.5">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = distribution[rating] || 0
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                        return (
                            <div key={rating} className="flex items-center gap-2.5 group">
                                <span className="text-white/60 text-xs w-4 font-medium">{rating}</span>
                                <Star size={14} weight="fill" className="text-amber-400 shrink-0" aria-hidden="true" />
                                <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                                        style={{ width: `${percentage}%` }}
                                        role="progressbar"
                                        aria-valuenow={percentage}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    />
                                </div>
                                <span className="text-white/50 text-xs w-10 text-right font-medium">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// Write Review Component
interface WriteReviewProps {
    bookingId: string
    talentId: string
    clientId: string
    onReviewSubmit: (review: Review) => void
    onClose?: () => void
}

export function WriteReviewModal({ bookingId, talentId, clientId, onReviewSubmit, onClose }: WriteReviewProps) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating')
            return
        }

        if (comment.length > 500) {
            setError('Comment must be 500 characters or less')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const supabase = createClient()

            // Get talent info for email
            const { data: talentData } = await supabase
                .from('profiles')
                .select('id, display_name')
                .eq('id', talentId)
                .single()

            // Get client info for email
            const { data: clientData } = await supabase
                .from('profiles')
                .select('id, display_name')
                .eq('id', clientId)
                .single()

            const { data, error: submitError } = await supabase
                .from('reviews')
                .insert({
                    booking_id: bookingId,
                    client_id: clientId,
                    talent_id: talentId,
                    rating,
                    comment: comment.trim() || null
                })
                .select(`
          *,
          client:profiles!reviews_client_id_fkey(id, display_name, avatar_url)
        `)
                .single()

            if (submitError) {
                if (submitError.code === '23505') {
                    setError('You have already reviewed this booking')
                } else {
                    throw submitError
                }
                return
            }

            // Send email notification to talent
            try {
                // Get talent's email from auth
                const { data: userData } = await supabase.auth.admin.getUserById(talentId)
                const talentEmail = userData?.user?.email

                if (talentEmail) {
                    await fetch('/api/email/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: talentEmail,
                            subject: `New ${rating}-Star Review on Nego!`,
                            type: 'review_received',
                            data: {
                                talentName: talentData?.display_name || 'there',
                                clientName: clientData?.display_name || 'A client',
                                rating,
                                comment: comment.trim() || 'No comment provided',
                                bookingId,
                            }
                        })
                    })
                }
            } catch (emailError) {
                // Don't fail the review submission if email fails
                console.error('[WriteReviewModal] Failed to send review notification email:', emailError)
            }

            onReviewSubmit(data)
            onClose?.()
        } catch (err) {
            console.error('[WriteReviewModal] Error submitting review:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit review. Please try again.'
            setError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle Escape key to close modal
    useEffect(() => {
        if (!onClose) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting) {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose, isSubmitting])

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [])

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="write-review-title"
        >
            <div
                className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 id="write-review-title" className="text-xl font-bold text-white">Write a Review</h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                            aria-label="Close review modal"
                            disabled={isSubmitting}
                        >
                            <X size={24} weight="duotone" aria-hidden="true" />
                        </button>
                    )}
                </div>

                {/* Star Rating - Enhanced with hover states */}
                <div className="mb-6">
                    <label className="text-white/70 text-sm mb-3 block font-medium">
                        How was your experience?
                    </label>
                    <div className="flex items-center justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => {
                                    setRating(star)
                                    setError(null)
                                }}
                                className="transition-all duration-200 hover:scale-110 active:scale-95"
                                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                aria-pressed={rating === star}
                                disabled={isSubmitting}
                            >
                                <Star
                                    size={40}
                                    weight={(hoverRating || rating) >= star ? 'fill' : 'regular'}
                                    className={`transition-all duration-200 ${(hoverRating || rating) >= star
                                            ? 'text-amber-400 drop-shadow-lg'
                                            : 'text-white/20 hover:text-white/40'
                                        }`}
                                    aria-hidden="true"
                                />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-center text-white/60 text-sm mt-3 font-medium">
                            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
                        </p>
                    )}
                </div>

                {/* Comment */}
                <div className="mb-6">
                    <label htmlFor="review-comment" className="text-white/70 text-sm mb-2 block font-medium">
                        Share your experience <span className="text-white/40">(optional)</span>
                    </label>
                    <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => {
                            setComment(e.target.value)
                            setError(null)
                        }}
                        placeholder="Tell others about your experience..."
                        maxLength={500}
                        rows={4}
                        aria-label="Review comment"
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? 'comment-error' : 'comment-help'}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 text-sm resize-none transition-colors"
                    />
                    <div className="flex items-center justify-between mt-1">
                        <p id="comment-help" className="text-white/40 text-xs">
                            {comment.length}/500 characters
                        </p>
                        {error && (
                            <p id="comment-error" className="text-red-400 text-xs flex items-center gap-1" role="alert">
                                <Warning size={12} aria-hidden="true" />
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2" role="alert">
                        <Warning size={18} weight="duotone" className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {onClose && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 border-white/20 text-white hover:bg-white/10 transition-colors"
                            disabled={isSubmitting}
                            aria-label="Cancel review"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white transition-colors disabled:opacity-50"
                        disabled={isSubmitting || rating === 0}
                        aria-label="Submit review"
                    >
                        {isSubmitting ? (
                            <>
                                <SpinnerGap size={18} className="animate-spin mr-2" aria-hidden="true" />
                                <span className="sr-only">Submitting review...</span>
                                Submitting...
                            </>
                        ) : (
                            'Submit Review'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
