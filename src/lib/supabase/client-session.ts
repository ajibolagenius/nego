'use client'

import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface BrowserAuthState {
    user: SupabaseUser | null
    role: string | null
}

type Listener = (state: BrowserAuthState) => void

let cachedState: BrowserAuthState | null = null
let inFlightPromise: Promise<BrowserAuthState> | null = null
let listenerInitialized = false
const listeners = new Set<Listener>()

function emit(state: BrowserAuthState) {
    cachedState = state
    for (const listener of listeners) {
        listener(state)
    }
}

async function fetchRoleForUser(userId: string): Promise<string> {
    const supabase = createClient()
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle()

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[BrowserAuth] Error fetching profile role:', error)
            }
            return 'client'
        }

        return profile?.role || 'client'
    } catch (err) {
        console.error('[BrowserAuth] Exception fetching profile role:', err)
        return 'client'
    }
}

function ensureAuthListener() {
    if (listenerInitialized || typeof window === 'undefined') return
    listenerInitialized = true

    const supabase = createClient()
    supabase.auth.onAuthStateChange((_event, session) => {
        const nextUser = session?.user ?? null

        if (!nextUser) {
            inFlightPromise = null
            emit({ user: null, role: null })
            return
        }

        if (cachedState?.user?.id === nextUser.id && cachedState.role) {
            emit({ user: nextUser, role: cachedState.role })
            return
        }

        void refreshBrowserAuthState(nextUser)
    })
}

async function refreshBrowserAuthState(knownUser?: SupabaseUser | null): Promise<BrowserAuthState> {
    if (inFlightPromise) {
        return inFlightPromise
    }

    inFlightPromise = (async () => {
        const supabase = createClient()
        let user = knownUser

        if (user === undefined) {
            const { data: { session } } = await supabase.auth.getSession()
            user = session?.user ?? null
        }

        if (!user) {
            const nextState: BrowserAuthState = { user: null, role: null }
            emit(nextState)
            return nextState
        }

        if (cachedState?.user?.id === user.id && cachedState.role) {
            const nextState: BrowserAuthState = { user, role: cachedState.role }
            emit(nextState)
            return nextState
        }

        const role = await fetchRoleForUser(user.id)
        const nextState: BrowserAuthState = { user, role }
        emit(nextState)
        return nextState
    })().finally(() => {
        inFlightPromise = null
    })

    return inFlightPromise
}

/**
 * Reads the current browser session locally (via getSession) and fetches the
 * user's role at most once per user/session, sharing the result across header
 * and admin preview components so public pages make zero auth/DB calls.
 */
export async function getBrowserAuthState(): Promise<BrowserAuthState> {
    ensureAuthListener()
    if (cachedState) {
        return cachedState
    }
    return refreshBrowserAuthState()
}

export function subscribeBrowserAuthState(listener: Listener): () => void {
    ensureAuthListener()
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export function clearBrowserAuthCache(): void {
    cachedState = null
    inFlightPromise = null
}
