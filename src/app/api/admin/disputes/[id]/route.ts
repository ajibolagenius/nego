import { NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin/audit-log'
import { validateAdmin } from '@/lib/admin/validation'
import { createApiClient } from '@/lib/supabase/api'

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const admin = await validateAdmin()

        if (!admin.isValid || !admin.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createApiClient()

        // Delete the dispute
        // Note: RLS might prevent this if using normal client, so we use service role via createApiClient
        const { error: deleteError } = await supabase
            .from('disputes')
            .delete()
            .eq('id', id)

        if (deleteError) {
            console.error('[Admin Dispute Delete] Error:', deleteError)
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        // Log the action
        await logAdminAction({
            admin_id: admin.userId,
            action: 'DELETE_DISPUTE',
            resource_type: 'booking',
            resource_id: id,
            details: { disputeId: id }
        })

        return NextResponse.json({ success: true, message: 'Dispute deleted successfully' })
    } catch (error) {
        console.error('[Admin Dispute Delete] Critical Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
