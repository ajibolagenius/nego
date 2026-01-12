import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    let template
    let recipientEmail

    switch (type) {
      case 'welcome':
        recipientEmail = data.email
        template = emailTemplates.welcome(data.name, data.role)
        break
        
      case 'new_booking':
        recipientEmail = data.talentEmail
        template = emailTemplates.newBooking(
          data.talentName,
          data.clientName,
          data.bookingAmount,
          data.bookingId
        )
        break
        
      case 'booking_update':
        recipientEmail = data.clientEmail
        template = emailTemplates.bookingUpdate(
          data.clientName,
          data.talentName,
          data.status,
          data.bookingId
        )
        break
        
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    const result = await sendEmail(recipientEmail, template)

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    } else {
      return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
