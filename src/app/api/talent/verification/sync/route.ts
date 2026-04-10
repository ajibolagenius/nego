import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncTalentAutoVerification } from '@/lib/talent-verification'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            )
        }

        if (profile.role !== 'talent') {
            return NextResponse.json(
                { error: 'Talent access required' },
                { status: 403 }
            )
        }

        const result = await syncTalentAutoVerification(user.id)
        return NextResponse.json(result)
    } catch (error) {
        console.error('[TalentVerificationSync] Error syncing talent verification:', error)
        return NextResponse.json(
            { error: 'Failed to sync talent verification' },
            { status: 500 }
        )
    }
}
