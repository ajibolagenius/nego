'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, User, ChatCircle, PaperPlaneTilt, SpinnerGap, X } from '@phosphor-icons/react'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleSubmitResponse = async () => {
    if (!response.trim()) return
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reviews')
        .update({ 
          talent_response: response,
          talent_responded_at: new Date().toISOString()
        })
        .eq('id', review.id)

      if (error) throw error
      
      setShowResponseForm(false)
      onResponseSubmit?.(review.id, response)
    } catch (error) {
      console.error('Error submitting response:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
          {review.client?.avatar_url ? (
            <Image
              src={review.client.avatar_url}
              alt={review.client.display_name || 'User'}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={20} className="text-white/40" />
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
          
          {/* Stars */}
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                weight={star <= review.rating ? 'fill' : 'regular'}
                className={star <= review.rating ? 'text-amber-400' : 'text-white/20'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-white/70 text-sm leading-relaxed mb-3">
          {review.comment}
        </p>
      )}

      {/* Talent Response */}
      {review.talent_response && (
        <div className="mt-3 pl-4 border-l-2 border-[#df2531]/30">
          <div className="flex items-center gap-2 mb-1">
            <ChatCircle size={14} className="text-[#df2531]" />
            <span className="text-[#df2531] text-xs font-medium">Talent Response</span>
          </div>
          <p className="text-white/60 text-sm">
            {review.talent_response}
          </p>
          {review.talent_responded_at && (
            <span className="text-white/30 text-xs mt-1 block">
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
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your response..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResponseForm(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting || !response.trim()}
                  className="bg-[#df2531] hover:bg-[#c41f2a] text-white"
                >
                  {isSubmitting ? (
                    <SpinnerGap size={16} className="animate-spin" />
                  ) : (
                    <>
                      <PaperPlaneTilt size={16} className="mr-1" />
                      Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResponseForm(true)}
              className="mt-3 flex items-center gap-2 text-[#df2531] text-sm hover:text-[#c41f2a] transition-colors"
            >
              <ChatCircle size={16} />
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
    <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Average Rating */}
        <div className="text-center sm:text-left">
          <p className="text-4xl sm:text-5xl font-bold text-white mb-1">
            {averageRating.toFixed(1)}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={18}
                weight={star <= Math.round(averageRating) ? 'fill' : 'regular'}
                className={star <= Math.round(averageRating) ? 'text-amber-400' : 'text-white/20'}
              />
            ))}
          </div>
          <p className="text-white/50 text-sm">{totalReviews} reviews</p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = distribution[rating] || 0
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
            
            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-white/50 text-xs w-3">{rating}</span>
                <Star size={12} weight="fill" className="text-amber-400" />
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-white/40 text-xs w-8 text-right">{count}</span>
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
        console.error('Failed to send review notification email:', emailError)
      }

      onReviewSubmit(data)
      onClose?.()
    } catch (err) {
      console.error('Error submitting review:', err)
      setError('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Write a Review</h3>
          {onClose && (
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <p className="text-white/60 text-sm mb-3">How was your experience?</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={36}
                  weight={(hoverRating || rating) >= star ? 'fill' : 'regular'}
                  className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-white/20'}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-white/50 text-sm mt-2">
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="text-white/60 text-sm mb-2 block">
            Share your experience (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about your experience..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 text-sm resize-none"
            rows={4}
            maxLength={500}
          />
          <p className="text-white/30 text-xs text-right mt-1">{comment.length}/500</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-[#df2531] hover:bg-[#c41f2a] text-white"
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <SpinnerGap size={18} className="animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Review'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
