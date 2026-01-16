'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Bell, BellRinging, Check, CheckCircle, Trash,
  CalendarCheck, Coin, ShieldCheck, Gift, ChatCircle, Star,
  CaretRight, Clock, X, MagnifyingGlass, SpinnerGap, Warning
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Notification, NotificationType } from '@/types/database'

interface NotificationsClientProps {
  user: SupabaseUser
  profile: Profile | null
  notifications: Notification[]
}

const notificationIcons: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  booking_request: { icon: CalendarCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  booking_accepted: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  booking_rejected: { icon: X, color: 'text-red-400', bg: 'bg-red-500/10' },
  booking_completed: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  booking_expired: { icon: Clock, color: 'text-white/40', bg: 'bg-white/5' },
  withdrawal_approved: { icon: Coin, color: 'text-green-400', bg: 'bg-green-500/10' },
  withdrawal_rejected: { icon: Coin, color: 'text-red-400', bg: 'bg-red-500/10' },
  general: { icon: Bell, color: 'text-[#df2531]', bg: 'bg-[#df2531]/10' },
}

export function NotificationsClient({ user, profile, notifications: initialNotifications }: NotificationsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [notificationsList, setNotificationsList] = useState(initialNotifications)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [deletingAllRead, setDeletingAllRead] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Channel ref for real-time subscriptions
  const notificationsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Real-time subscription for notifications
  useEffect(() => {
    // Cleanup existing channel
    if (notificationsChannelRef.current) {
      supabase.removeChannel(notificationsChannelRef.current)
    }

    const notificationsChannel = supabase
      .channel(`notifications:${user.id}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Notifications] Real-time INSERT:', payload.new)
          const newNotification = payload.new as Notification
          setNotificationsList((prev) => [newNotification, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Notifications] Real-time UPDATE:', payload.new)
          const updatedNotification = payload.new as Notification
          setNotificationsList((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Notifications] Real-time DELETE:', payload.old)
          setNotificationsList((prev) => prev.filter((n) => n.id !== payload.old.id))
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Channel subscription status:', status)
      })

    notificationsChannelRef.current = notificationsChannel

    return () => {
      console.log('[Notifications] Cleaning up notifications channel')
      if (notificationsChannelRef.current) {
        supabase.removeChannel(notificationsChannelRef.current)
        notificationsChannelRef.current = null
      }
    }
  }, [user.id, supabase])

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notificationsList

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((n) => n.type === filterType)
    }

    // Search by title or message
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [notificationsList, filterType, searchQuery])

  const unreadCount = useMemo(
    () => notificationsList.filter((n) => !n.is_read).length,
    [notificationsList]
  )

  const filteredUnreadCount = useMemo(
    () => filteredNotifications.filter((n) => !n.is_read).length,
    [filteredNotifications]
  )

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      // Optimistic update (real-time will confirm)
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('[Notifications] Error marking as read:', err)
      setError('Failed to mark notification as read')
      setTimeout(() => setError(null), 5000)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAllRead(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      // Optimistic update (real-time will confirm)
      setNotificationsList((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
    } catch (err) {
      console.error('[Notifications] Error marking all as read:', err)
      setError('Failed to mark all notifications as read')
      setTimeout(() => setError(null), 5000)
    } finally {
      setMarkingAllRead(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    setDeletingId(notificationId)
    setError(null)
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Optimistic update (real-time will confirm)
      setNotificationsList((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (err) {
      console.error('[Notifications] Error deleting notification:', err)
      setError('Failed to delete notification')
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeletingId(null)
    }
  }

  const deleteAllRead = async () => {
    setDeletingAllRead(true)
    setError(null)
    try {
      const readIds = notificationsList.filter((n) => n.is_read).map((n) => n.id)
      if (readIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', readIds)

      if (error) throw error

      // Optimistic update (real-time will confirm)
      setNotificationsList((prev) => prev.filter((n) => !n.is_read))
      setShowDeleteConfirm(false)
    } catch (err) {
      console.error('[Notifications] Error deleting all read:', err)
      setError('Failed to delete read notifications')
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeletingAllRead(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const clearFilter = () => {
    setFilterType('all')
  }

  const getNotificationLink = (notification: Notification): string | null => {
    const data = notification.data as Record<string, unknown> | null
    if (!data) return null

    if (data.booking_id) {
      return `/dashboard/bookings/${data.booking_id}`
    }
    if (data.talent_id) {
      return `/talent/${data.talent_id}`
    }
    if (data.gift_id) {
      return `/dashboard/wallet`
    }
    return null
  }

  const readCount = notificationsList.filter((n) => n.is_read).length

  return (
    <>
      <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
        {/* Header */}
        <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link 
                  href="/dashboard" 
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft size={24} aria-hidden="true" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <BellRinging size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                    Notifications
                  </h1>
                  <p className="text-white/50 text-sm" role="status" aria-live="polite">
                    {filteredNotifications.length !== notificationsList.length
                      ? `${filteredNotifications.length} of ${notificationsList.length} notifications`
                      : unreadCount > 0
                      ? `${unreadCount} unread`
                      : 'All caught up'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    disabled={markingAllRead}
                    variant="ghost"
                    className="text-[#df2531] hover:text-[#df2531]/80 text-sm"
                    aria-label="Mark all notifications as read"
                  >
                    {markingAllRead ? (
                      <>
                        <SpinnerGap size={18} className="mr-2 animate-spin" aria-hidden="true" />
                        <span className="sr-only">Marking all as read...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} className="mr-2" aria-hidden="true" />
                        Mark all read
                      </>
                    )}
                  </Button>
                )}
                {readCount > 0 && (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deletingAllRead}
                    variant="ghost"
                    className="text-white/60 hover:text-white/80 text-sm"
                    aria-label="Delete all read notifications"
                  >
                    <Trash size={18} className="mr-2" aria-hidden="true" />
                    Delete read
                  </Button>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            {notificationsList.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlass 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" 
                    size={18} 
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notifications..."
                    autoComplete="off"
                    aria-label="Search notifications by title or message"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#df2531]/50 transition-colors text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
                  aria-label="Filter notifications by type"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#df2531]/50 transition-colors"
                >
                  <option value="all">All Types</option>
                  <option value="booking_request">Booking Requests</option>
                  <option value="booking_accepted">Accepted</option>
                  <option value="booking_rejected">Rejected</option>
                  <option value="booking_completed">Completed</option>
                  <option value="booking_expired">Expired</option>
                  <option value="withdrawal_approved">Withdrawals Approved</option>
                  <option value="withdrawal_rejected">Withdrawals Rejected</option>
                  <option value="general">General</option>
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto px-4 pt-4" role="alert">
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <Warning size={20} className="text-red-400" aria-hidden="true" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400/60 hover:text-red-400 transition-colors"
                aria-label="Dismiss error"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-6">
          {notificationsList.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10" role="status">
              <Bell size={64} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-white mb-2">No Notifications</h3>
              <p className="text-white/50 mb-4">
                You&apos;re all caught up! Notifications about bookings, gifts, and messages will appear here.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
              >
                Go to Dashboard
                <CaretRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10" role="status">
              <MagnifyingGlass size={64} weight="duotone" className="text-white/20 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
              <p className="text-white/50 mb-4">
                No notifications match your search or filter criteria.
              </p>
              <div className="flex items-center justify-center gap-2">
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
                {filterType !== 'all' && (
                  <button
                    onClick={clearFilter}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3" role="list">
              {filteredNotifications.map((notification) => {
                const iconConfig = notificationIcons[notification.type] || notificationIcons.general
                const Icon = iconConfig.icon
                const link = getNotificationLink(notification)

                return (
                  <div
                    key={notification.id}
                    data-testid={`notification-${notification.id}`}
                    role="listitem"
                    className={`relative p-4 rounded-xl border transition-all ${
                      notification.is_read
                        ? 'bg-white/5 border-white/10'
                        : 'bg-[#df2531]/5 border-[#df2531]/20'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${iconConfig.bg}`} aria-hidden="true">
                        <Icon size={24} weight="duotone" className={iconConfig.color} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-medium ${notification.is_read ? 'text-white/80' : 'text-white'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-white/40 text-xs whitespace-nowrap" aria-label={`Created ${formatTime(notification.created_at)}`}>
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className={`text-sm ${notification.is_read ? 'text-white/50' : 'text-white/70'}`}>
                          {notification.message}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-3">
                          {link && (
                            <Link
                              href={link}
                              onClick={() => !notification.is_read && markAsRead(notification.id)}
                              className="flex items-center gap-1 text-[#df2531] text-sm font-medium hover:underline"
                              aria-label={`View details for ${notification.title}`}
                            >
                              View Details
                              <CaretRight size={14} aria-hidden="true" />
                            </Link>
                          )}
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center gap-1 text-white/40 text-sm hover:text-white/60 transition-colors"
                              aria-label={`Mark ${notification.title} as read`}
                            >
                              <Check size={14} aria-hidden="true" />
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            disabled={deletingId === notification.id}
                            className="flex items-center gap-1 text-white/40 text-sm hover:text-red-400 ml-auto transition-colors disabled:opacity-50"
                            aria-label={`Delete ${notification.title}`}
                          >
                            {deletingId === notification.id ? (
                              <>
                                <SpinnerGap size={14} className="animate-spin" aria-hidden="true" />
                                <span className="sr-only">Deleting...</span>
                              </>
                            ) : (
                              <Trash size={14} aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#df2531]" aria-label="Unread notification" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Delete All Read Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <div
              className="bg-[#0a0a0f] rounded-2xl w-full max-w-sm border border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash size={32} className="text-red-400" aria-hidden="true" />
                </div>
                <h3 id="delete-confirm-title" className="text-xl font-bold text-white mb-2">
                  Delete All Read Notifications?
                </h3>
                <p className="text-white/60 text-sm">
                  This will permanently delete {readCount} read notification{readCount !== 1 ? 's' : ''}. This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingAllRead}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                  aria-label="Cancel deletion"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAllRead}
                  disabled={deletingAllRead}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  aria-label="Confirm delete all read notifications"
                >
                  {deletingAllRead ? (
                    <>
                      <SpinnerGap size={18} className="animate-spin inline mr-2" aria-hidden="true" />
                      <span className="sr-only">Deleting...</span>
                      Deleting...
                    </>
                  ) : (
                    'Delete All'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <MobileBottomNav userRole={profile?.role || 'client'} />
    </>
  )
}
