'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Bell,
    Check,
    X,
    BellOff,
    Info,
    Clock,
    AlertCircle,
    DollarSign,
    UserCheck,
    UserX,
    Calendar,
    CheckCheck,
} from 'lucide-react'
import { useNotifications } from '@/providers/NotificationProvider'
import type { Notification, NotificationType } from '@/types/database'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Icon = typeof Bell

const notificationIcons: Record<NotificationType, Icon> = {
    booking_request: Calendar,
    booking_accepted: UserCheck,
    booking_rejected: UserX,
    booking_cancelled: AlertCircle,
    booking_completed: CheckCheck,
    booking_expired: Clock,
    withdrawal_approved: DollarSign,
    withdrawal_rejected: AlertCircle,
    purchase_success: DollarSign,
    purchase_failed: AlertCircle,
    low_balance: AlertCircle,
    media_unlocked: Info,
    gift_received: Info,
    gift_sent: Info,
    general: Info,
}

const notificationColors: Record<NotificationType, string> = {
    booking_request: 'text-blue-500 bg-blue-500/10',
    booking_accepted: 'text-green-500 bg-green-500/10',
    booking_rejected: 'text-red-500 bg-red-500/10',
    booking_cancelled: 'text-red-500 bg-red-500/10',
    booking_completed: 'text-emerald-500 bg-emerald-500/10',
    booking_expired: 'text-gray-500 bg-gray-500/10',
    withdrawal_approved: 'text-green-500 bg-green-500/10',
    withdrawal_rejected: 'text-red-500 bg-red-500/10',
    purchase_success: 'text-green-500 bg-green-500/10',
    purchase_failed: 'text-red-500 bg-red-500/10',
    low_balance: 'text-amber-500 bg-amber-500/10',
    media_unlocked: 'text-purple-500 bg-purple-500/10',
    gift_received: 'text-pink-500 bg-pink-500/10',
    gift_sent: 'text-pink-500 bg-pink-500/10',
    general: 'text-blue-500 bg-blue-500/10',
}

interface NotificationBellProps {
    userId: string
}

export function NotificationBell({ userId: _userId }: NotificationBellProps) {
    const {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refresh
    } = useNotifications()

    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Pull to refresh / initial fetch is handled by provider
    useEffect(() => {
        if (isOpen) {
            refresh()
        }
    }, [isOpen, refresh])

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
        const data = notification.data as { booking_id?: string; url?: string } | null
        if (data?.url) return data.url
        if (data?.booking_id) {
            return `/dashboard/bookings/${data.booking_id}`
        }
        if (notification.type.includes('withdrawal')) {
            return '/dashboard/talent?tab=withdrawals'
        }
        return '/dashboard/notifications'
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-height-[400px] overflow-y-auto custom-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-400 text-sm">Loading notifications...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center">
                                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <BellOff className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                                <p className="text-gray-400 text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => {
                                    const NotificationIcon = notificationIcons[notification.type] || Info
                                    return (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-4 hover:bg-white/5 transition-colors cursor-pointer group relative",
                                                !notification.is_read && "bg-blue-500/5"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                    notificationColors[notification.type] || 'text-blue-500 bg-blue-500/10'
                                                )}>
                                                    <NotificationIcon className="w-5 h-5" />
                                                </div>
                                                <div className="grow min-w-0" onClick={() => {
                                                    if (!notification.is_read) markAsRead(notification.id)
                                                    setIsOpen(false)
                                                }}>
                                                    <Link href={getNotificationLink(notification)} className="block">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p className={cn(
                                                                "text-sm font-semibold truncate pr-4",
                                                                notification.is_read ? "text-gray-300" : "text-white"
                                                            )}>
                                                                {notification.title}
                                                            </p>
                                                            <span className="text-[10px] text-gray-500 shrink-0 mt-0.5">
                                                                {formatTime(notification.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className={cn(
                                                            "text-xs line-clamp-2",
                                                            notification.is_read ? "text-gray-500" : "text-gray-300"
                                                        )}>
                                                            {notification.message}
                                                        </p>
                                                    </Link>
                                                </div>
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            markAsRead(notification.id)
                                                        }}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:text-blue-300 bg-[#0A0A0B] rounded-full border border-white/10 shadow-lg transition-all"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-white/5 border-t border-white/10 text-center">
                        <Link
                            href="/dashboard/notifications"
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
