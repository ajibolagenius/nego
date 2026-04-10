'use client'

// Note: Using 'use client' because this will be called from client components,
// but the actual logic depends on cookies which we handle via a small API or next/headers in server components.
// Actually, since I need to set cookies, I'll make it a Server Action.

import { ROLE_PREVIEW_COOKIE } from '@/lib/admin/role-preview'

export async function setRolePreviewAction(role: string | null) {
    // We'll use a dynamic import for 'next/headers' to avoid issues in client contexts
    const { cookies } = await import('next/headers')
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

    // Dynamic import to avoid build errors if used in non-server context
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
}
