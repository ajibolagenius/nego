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
        const body = await request.json()
        const { adminNotes } = body

        // Use API client to bypass RLS
        const apiClient = createApiClient()

        // Check if talent exists and is actually a talent
        const { data: talent, error: talentError } = await apiClient
            .from('profiles')
            .select('id, role, display_name, username, admin_notes')
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

        // Update admin notes
        const { error: updateError } = await apiClient
            .from('profiles')
            .update({
                admin_notes: adminNotes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', talentId)

        if (updateError) {
            console.error('[Update Talent Notes] Error updating admin notes:', updateError)
            return NextResponse.json(
                { error: `Failed to update admin notes: ${updateError.message}` },
                { status: 500 }
            )
        }

        // Log admin action
        await logAdminAction({
            admin_id: adminCheck.userId!,
            action: 'update_talent_notes',
            resource_type: 'user',
            resource_id: talentId,
            details: {
                talent_id: talentId,
                talent_name: talent.display_name || talent.username || 'Unknown',
                previous_notes: talent.admin_notes || null,
                new_notes: adminNotes || null
            },
            ip_address: getClientIP(request.headers),
            user_agent: getUserAgent(request.headers),
        })

        return NextResponse.json({
            success: true,
            message: 'Admin notes updated successfully'
        })
    } catch (error) {
        console.error('[Update Talent Notes] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
