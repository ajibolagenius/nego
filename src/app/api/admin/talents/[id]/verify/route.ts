import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction, getClientIP, getUserAgent } from '@/lib/admin/audit-log'
import { validateAdmin } from '@/lib/admin/validation'
import { createApiClient } from '@/lib/supabase/api'

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

        const body = await request.json().catch(() => ({}))
        const { adminNotes } = body

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

        if (talent.is_verified) {
            return NextResponse.json(
                { error: 'Talent is already verified' },
                { status: 400 }
            )
        }

        // Update talent verification status and optionally admin notes
        const updateData: Record<string, unknown> = {
            is_verified: true,
            updated_at: new Date().toISOString()
        }

        // If admin notes provided, update them
        if (adminNotes !== undefined) {
            updateData.admin_notes = adminNotes || null
        }

        const { error: updateError } = await apiClient
            .from('profiles')
            .update(updateData)
            .eq('id', talentId)

        if (updateError) {
            console.error('[Verify Talent] Error updating talent:', updateError)
            return NextResponse.json(
                { error: `Failed to verify talent: ${updateError.message}` },
                { status: 500 }
            )
        }

        // Log admin action
        await logAdminAction({
            admin_id: adminCheck.userId!,
            action: 'verify_talent',
            resource_type: 'user',
            resource_id: talentId,
            details: {
                talent_id: talentId,
                talent_name: talent.display_name || talent.username || 'Unknown',
                previous_status: false,
                new_status: true,
                admin_notes: adminNotes || null
            },
            ip_address: getClientIP(request.headers),
            user_agent: getUserAgent(request.headers),
        })

        return NextResponse.json({
            success: true,
            message: 'Talent verified successfully'
        })
    } catch (error) {
        console.error('[Verify Talent] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
