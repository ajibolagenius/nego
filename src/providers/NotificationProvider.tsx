'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
    error: string | null
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20)

            if (fetchError) throw fetchError

            if (data) {
                setNotifications(data as Notification[])
                setUnreadCount(data.filter((n) => !n.is_read).length)
            }
        } catch (err) {
            console.error('[NotificationProvider] Error fetching notifications:', err)
            setError('Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }, [userId, supabase])

    useEffect(() => {
        if (!userId) return

        fetchNotifications()

        // Cleanup existing channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
        }

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`notifications-global:${userId}`)
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
                    setNotifications((prev) => [newNotification, ...prev.slice(0, 19)])
                    setUnreadCount((prev) => prev + 1)
                    
                    // Trigger a revalidation of routes if needed, or play a sound
                    // router.refresh();
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
                    const updatedNotification = payload.new as Notification
                    setNotifications((prev) => {
                        const next = prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
                        setUnreadCount(next.filter((n) => !n.is_read).length)
                        return next
                    })
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [userId, supabase, fetchNotifications])

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)

            if (error) throw error
            
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error('[NotificationProvider] Error marking as read:', err)
        }
    }

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length === 0) return

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds)

            if (error) throw error

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error('[NotificationProvider] Error marking all as read:', err)
        }
    }

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    }

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}
