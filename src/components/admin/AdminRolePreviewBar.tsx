'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { RolePreviewSwitcher } from '@/components/admin/RolePreviewSwitcher'
import { PreviewRole, ROLE_PREVIEW_COOKIE } from '@/lib/admin/role-preview'
import { getBrowserAuthState, subscribeBrowserAuthState } from '@/lib/supabase/client-session'

const VALID_PREVIEW_ROLES: PreviewRole[] = ['admin', 'talent', 'client', 'guest']

function readPreviewCookie(): PreviewRole {
    if (typeof document === 'undefined') return 'admin'
    const prefix = `${ROLE_PREVIEW_COOKIE}=`
    const match = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix))

    if (!match) return 'admin'
    const value = decodeURIComponent(match.slice(prefix.length)) as PreviewRole
    return VALID_PREVIEW_ROLES.includes(value) ? value : 'admin'
}

/**
 * Client-side admin gate for RolePreviewSwitcher so RootLayout does not have to
 * read cookies() or call supabase.auth.getUser() on every request (which forced
 * every route in the app into dynamic SSR).
 */
export function AdminRolePreviewBar() {
    const pathname = usePathname()
    const [isAdmin, setIsAdmin] = useState(false)
    const [previewRole, setPreviewRole] = useState<PreviewRole>('admin')

    useEffect(() => {
        let active = true

        getBrowserAuthState().then((state) => {
            if (!active) return
            const admin = state.role === 'admin'
            setIsAdmin(admin)
            if (admin) {
                setPreviewRole(readPreviewCookie())
            }
        })

        const unsubscribe = subscribeBrowserAuthState((state) => {
            if (!active) return
            const admin = state.role === 'admin'
            setIsAdmin(admin)
            if (admin) {
                setPreviewRole(readPreviewCookie())
            }
        })

        return () => {
            active = false
            unsubscribe()
        }
    }, [])

    useEffect(() => {
        if (!isAdmin) return
        const timer = setTimeout(() => setPreviewRole(readPreviewCookie()), 0)
        return () => clearTimeout(timer)
    }, [isAdmin, pathname])

    if (!isAdmin) {
        return null
    }

    return <RolePreviewSwitcher currentRole={previewRole} />
}
