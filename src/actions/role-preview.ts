'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ROLE_PREVIEW_COOKIE } from '@/lib/admin/role-preview'

/**
 * Server action to set or clear the role preview cookie.
 * Requires 'use server' to interact with next/headers.
 */
export async function setRolePreviewAction(role: string | null) {
    const cookieStore = await cookies()

    if (!role || role === 'admin') {
        cookieStore.delete(ROLE_PREVIEW_COOKIE)
    } else {
        cookieStore.set(ROLE_PREVIEW_COOKIE, role, {
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
            httpOnly: false, // Accessible to client for UI state if needed, but primarily for server
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
    }

    // Refresh the current layout to apply role changes globally
    revalidatePath('/', 'layout')
}
