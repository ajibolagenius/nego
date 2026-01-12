'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, X, CheckCircle, Clock, XCircle, Money, CalendarCheck, Icon } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationType } from '@/types/database'

const notificationIcons: Record<NotificationType, Icon> = {
  booking_request: CalendarCheck,
  booking_accepted: CheckCircle,
  booking_rejected: XCircle,
  booking_completed: CheckCircle,
  withdrawal_approved: Money,
  withdrawal_rejected: XCircle,
  general: Bell,
}

const notificationColors: Record<NotificationType, string> = {
  booking_request: 'text-blue-400 bg-blue-500/10',
  booking_accepted: 'text-green-400 bg-green-500/10',
  booking_rejected: 'text-red-400 bg-red-500/10',
  booking_completed: 'text-green-400 bg-green-500/10',
  withdrawal_approved: 'text-green-400 bg-green-500/10',
  withdrawal_rejected: 'text-red-400 bg-red-500/10',
  general: 'text-white/60 bg-white/10',
}

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Fetch notifications
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setNotifications(data as Notification[])
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }

  // Subscribe to realtime notifications
  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev.slice(0, 9)])
          setUnreadCount((prev) => prev + 1)
          
          // Play sound or show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

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

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        data-testid="notification-bell"
      >
        <Bell size={22} weight={unreadCount > 0 ? 'fill' : 'regular'} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#df2531] text-white text-xs font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[#df2531] text-sm hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-white/20 mx-auto mb-2" />
                <p className="text-white/50 text-sm">No notifications yet</p>
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
                    className={`flex items-start gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 ${
                      !notification.is_read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon size={20} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${notification.is_read ? 'text-white/70' : 'text-white'}`}>
                        {notification.title}
                      </p>
                      <p className="text-white/50 text-xs mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#df2531] shrink-0 mt-2" />
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
