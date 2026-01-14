'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Bell, BellRinging, Check, CheckCircle, Trash,
  CalendarCheck, Coin, ShieldCheck, Gift, ChatCircle, Star,
  CaretRight, Clock, X
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile, Notification } from '@/types/database'

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

export function NotificationsClient({ user, profile, notifications }: NotificationsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [notificationsList, setNotificationsList] = useState(notifications)
  const [loading, setLoading] = useState(false)

  const unreadCount = notificationsList.filter(n => !n.is_read).length

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
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      setNotificationsList(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotificationsList(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (err) {
      console.error('Error marking all as read:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      setNotificationsList(prev =>
        prev.filter(n => n.id !== notificationId)
      )
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
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

  return (
    <>
      <div className="min-h-screen bg-black pt-16 lg:pt-0 pb-20 lg:pb-0">
        {/* Header */}
        <header className="sticky top-16 lg:top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
                  <ArrowLeft size={24} />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <BellRinging size={24} weight="duotone" className="text-[#df2531]" />
                    Notifications
                  </h1>
                  <p className="text-white/50 text-sm">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
              
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  disabled={loading}
                  variant="ghost"
                  className="text-[#df2531] hover:text-[#df2531]/80 text-sm"
                >
                  <Check size={18} className="mr-2" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {notificationsList.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
              <Bell size={64} weight="duotone" className="text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Notifications</h3>
              <p className="text-white/50">
                You&apos;re all caught up! Notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificationsList.map((notification) => {
                const iconConfig = notificationIcons[notification.type] || notificationIcons.general
                const Icon = iconConfig.icon
                const link = getNotificationLink(notification)

                return (
                  <div
                    key={notification.id}
                    data-testid={`notification-${notification.id}`}
                    className={`relative p-4 rounded-xl border transition-all ${
                      notification.is_read
                        ? 'bg-white/5 border-white/10'
                        : 'bg-[#df2531]/5 border-[#df2531]/20'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${iconConfig.bg}`}>
                        <Icon size={24} weight="duotone" className={iconConfig.color} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-medium ${notification.is_read ? 'text-white/80' : 'text-white'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-white/40 text-xs whitespace-nowrap">
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
                            >
                              View Details
                              <CaretRight size={14} />
                            </Link>
                          )}
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center gap-1 text-white/40 text-sm hover:text-white/60"
                            >
                              <Check size={14} />
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="flex items-center gap-1 text-white/40 text-sm hover:text-red-400 ml-auto"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#df2531]" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav userRole={profile?.role || 'client'} />
    </>
  )
}
