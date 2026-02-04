'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, CheckCircle, XCircle, Money, CalendarCheck, Hourglass, Icon, SpinnerGap, Gift, LockOpen, Warning } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationType } from '@/types/database'

const notificationIcons: Record<NotificationType, Icon> = {
    booking_request: CalendarCheck,
    booking_accepted: CheckCircle,
    booking_rejected: XCircle,
    booking_completed: CheckCircle,
    booking_expired: Hourglass,
    withdrawal_approved: Money,
    withdrawal_rejected: XCircle,
    purchase_success: CheckCircle,
    purchase_failed: XCircle,
    low_balance: Warning,
    media_unlocked: LockOpen,
    gift_received: Gift,
    gift_sent: Gift,
    general: Bell,
}

const notificationColors: Record<NotificationType, string> = {
    booking_request: 'text-blue-400 bg-blue-500/10',
    booking_accepted: 'text-green-400 bg-green-500/10',
    booking_rejected: 'text-red-400 bg-red-500/10',
    booking_completed: 'text-green-400 bg-green-500/10',
    booking_expired: 'text-gray-400 bg-gray-500/10',
    withdrawal_approved: 'text-green-400 bg-green-500/10',
    withdrawal_rejected: 'text-red-400 bg-red-500/10',
    purchase_success: 'text-green-400 bg-green-500/10',
    purchase_failed: 'text-red-400 bg-red-500/10',
    low_balance: 'text-amber-400 bg-amber-500/10',
    media_unlocked: 'text-purple-400 bg-purple-500/10',
    gift_received: 'text-pink-400 bg-pink-500/10',
    gift_sent: 'text-pink-400 bg-pink-500/10',
    general: 'text-white/60 bg-white/10',
}

interface NotificationBellProps {
    userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const notificationsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const supabase = createClient()

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10)

            if (fetchError) throw fetchError

            if (data) {
                setNotifications(data as Notification[])
                setUnreadCount(data.filter((n) => !n.is_read).length)
            }
        } catch (err) {
            console.error('[NotificationBell] Error fetching notifications:', err)
            setError('Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }

    // Subscribe to realtime notifications
    useEffect(() => {
        fetchNotifications()

        // Cleanup existing channel
        if (notificationsChannelRef.current) {
            supabase.removeChannel(notificationsChannelRef.current)
        }

        // Subscribe to new and updated notifications
        const channel = supabase
            .channel(`notification-bell:${userId}`, {
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
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('[NotificationBell] Real-time INSERT:', payload.new)
                    const newNotification = payload.new as Notification
                    setNotifications((prev) => [newNotification, ...prev.slice(0, 9)])
                    setUnreadCount((prev) => prev + 1)

                    // Show browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        try {
                            new Notification(newNotification.title, {
                                body: newNotification.message,
                                icon: '/favicon.ico',
                                tag: `notification-${newNotification.id}`,
                            })
                        } catch (err) {
                            console.error('[NotificationBell] Error showing browser notification:', err)
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('[NotificationBell] Real-time UPDATE:', payload.new)
                    const updatedNotification = payload.new as Notification
                    setNotifications((prev) =>
                        prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
                    )
                    // Recalculate unread count
                    setNotifications((current) => {
                        const unread = current.filter((n) => !n.is_read).length
                        setUnreadCount(unread)
                        return current
                    })
                }
            )
            .subscribe((status) => {
                console.log('[NotificationBell] Channel subscription status:', status)
            })

        notificationsChannelRef.current = channel

        return () => {
            console.log('[NotificationBell] Cleaning up notification channel')
            if (notificationsChannelRef.current) {
                supabase.removeChannel(notificationsChannelRef.current)
                notificationsChannelRef.current = null
            }
        }
    }, [userId, supabase])

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Mark all as read
    const markAllAsRead = async () => {
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
        if (unreadIds.length === 0) return

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds)

            if (error) throw error

            // Optimistic update (real-time will confirm)
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error('[NotificationBell] Error marking all as read:', err)
            setError('Failed to mark all as read')
            setTimeout(() => setError(null), 3000)
        }
    }

    // Mark single notification as read
    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)

            if (error) throw error

            // Optimistic update (real-time will confirm)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch (err) {
            console.error('[NotificationBell] Error marking as read:', err)
            // Non-critical error, don't show to user
        }
    }

    const formatTime = (dateString: string) => {
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
        return date.toLocaleDateString()
    }

    const getNotificationLink = (notification: Notification) => {
        const data = notification.data as { booking_id?: string } | null
        if (data?.booking_id) {
            return `/dashboard/bookings/${data.booking_id}`
        }
        if (notification.type.includes('withdrawal')) {
            return '/dashboard/talent?tab=withdrawals'
        }
        return '/dashboard'
    }

    // Recalculate unread count when notifications change
    useEffect(() => {
        const unread = notifications.filter((n) => !n.is_read).length
        setUnreadCount(unread)
    }, [notifications])

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                data-testid="notification-bell"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Bell size={22} weight={unreadCount > 0 ? 'fill' : 'regular'} className="text-white" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#df2531] text-white text-xs font-bold flex items-center justify-center animate-pulse"
                        aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-14 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1rem)] bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                    role="menu"
                    aria-label="Notifications menu"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h3 className="text-white font-bold">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[#df2531] text-sm hover:underline transition-colors"
                                aria-label="Mark all notifications as read"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="px-4 pt-2" role="alert">
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-red-400 text-xs">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center" role="status" aria-live="polite">
                                <SpinnerGap size={32} className="text-white/20 mx-auto mb-2 animate-spin" aria-hidden="true" />
                                <p className="text-white/50 text-sm">Loading notifications...</p>
                                <span className="sr-only">Loading notifications</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center" role="status">
                                <Bell size={32} className="text-white/20 mx-auto mb-2" aria-hidden="true" />
                                <p className="text-white/50 text-sm">No notifications yet</p>
                                <p className="text-white/30 text-xs mt-1">You&apos;re all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = notificationIcons[notification.type] || Bell
                                const colorClass = notificationColors[notification.type] || notificationColors.general

                                return (
                                    <Link
                                        key={notification.id}
                                        href={getNotificationLink(notification)}
                                        onClick={() => {
                                            markAsRead(notification.id)
                                            setIsOpen(false)
                                        }}
                                        role="menuitem"
                                        className={`flex items-start gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 ${!notification.is_read ? 'bg-white/5' : ''
                                            }`}
                                        aria-label={`${notification.title}. ${notification.message}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`} aria-hidden="true">
                                            <Icon size={20} weight="duotone" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${notification.is_read ? 'text-white/70' : 'text-white'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-white/50 text-xs mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-white/30 text-xs mt-1" aria-label={`Created ${formatTime(notification.created_at)}`}>
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 rounded-full bg-[#df2531] shrink-0 mt-2" aria-label="Unread notification" />
                                        )}
                                    </Link>
                                )
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-white/10">
                            <Link
                                href="/dashboard/notifications"
                                onClick={() => setIsOpen(false)}
                                className="block text-center text-[#df2531] text-sm hover:underline"
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
