import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { validateAdmin } from '@/lib/admin/validation'
import { logAdminAction, getClientIP, getUserAgent } from '@/lib/admin/audit-log'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Validate admin access
        const adminCheck = await validateAdmin()
        if (!adminCheck.isValid) {
            return NextResponse.json(
                { error: adminCheck.error || 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params
        const talentId = id

        // Use API client to bypass RLS
        const apiClient = createApiClient()

        // Check if talent exists and is actually a talent
        const { data: talent, error: talentError } = await apiClient
            .from('profiles')
            .select('id, role, display_name, username, is_verified')
            .eq('id', talentId)
            .single()

        if (talentError || !talent) {
            return NextResponse.json(
                { error: 'Talent not found' },
                { status: 404 }
            )
        }

        if (talent.role !== 'talent') {
            return NextResponse.json(
                { error: 'User is not a talent' },
                { status: 400 }
            )
        }

        if (!talent.is_verified) {
            return NextResponse.json(
                { error: 'Talent is already unverified' },
                { status: 400 }
            )
        }

        // Update talent verification status
        const { error: updateError } = await apiClient
            .from('profiles')
            .update({
                is_verified: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', talentId)

        if (updateError) {
            console.error('[Unverify Talent] Error updating talent:', updateError)
            return NextResponse.json(
                { error: `Failed to unverify talent: ${updateError.message}` },
                { status: 500 }
            )
        }

        // Log admin action
        await logAdminAction({
            admin_id: adminCheck.userId!,
            action: 'unverify_talent',
            resource_type: 'user',
            resource_id: talentId,
            details: {
                talent_id: talentId,
                talent_name: talent.display_name || talent.username || 'Unknown',
                previous_status: true,
                new_status: false
            },
            ip_address: getClientIP(request.headers),
            user_agent: getUserAgent(request.headers),
        })

        return NextResponse.json({
            success: true,
            message: 'Talent unverified successfully'
        })
    } catch (error) {
        console.error('[Unverify Talent] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
