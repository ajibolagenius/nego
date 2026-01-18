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
    const { type, to, data } = body

    let template
    let recipientEmail = to

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

      case 'review_received':
        recipientEmail = to
        template = emailTemplates.reviewReceived(
          data.talentName,
          data.clientName,
          data.rating,
          data.comment
        )
        break

      case 'admin_digest':
        recipientEmail = to
        template = emailTemplates.adminDigest(data)
        break

      case 'verify_email':
        recipientEmail = data.email
        template = emailTemplates.verifyEmail(data.name, data.verificationUrl)
        break

      case 'email_verified':
        recipientEmail = data.email
        template = emailTemplates.emailVerified(data.name)
        break
        
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient email provided' }, { status: 400 })
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
