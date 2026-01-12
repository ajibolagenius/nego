import { Resend } from 'resend'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

// Sender email - use verified domain or Resend's test domain
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'Nego <onboarding@resend.dev>'

// Email templates
export const emailTemplates = {
  // Welcome email for new users
  welcome: (name: string, role: string) => ({
    subject: 'Welcome to Nego!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 40px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; margin: 0;">
            <span style="color: #fff;">NEGO</span><span style="color: #df2531;">.</span>
          </h1>
        </div>
        
        <h2 style="color: #fff; margin-bottom: 20px;">Welcome, ${name}!</h2>
        
        <p style="color: #999; line-height: 1.6;">
          Thank you for joining Nego as a <strong style="color: #df2531;">${role}</strong>.
          ${role === 'talent' 
            ? 'Start setting up your profile to connect with premium clients.'
            : 'Browse our exclusive talent and book unforgettable experiences.'}
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nego.app'}/dashboard" 
             style="display: inline-block; background: #df2531; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 40px;">
          © ${new Date().getFullYear()} Nego. All rights reserved.
        </p>
      </div>
    `,
  }),

  // New booking notification for talent
  newBooking: (talentName: string, clientName: string, bookingAmount: number, bookingId: string) => ({
    subject: '🎉 New Booking Request!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 40px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; margin: 0;">
            <span style="color: #fff;">NEGO</span><span style="color: #df2531;">.</span>
          </h1>
        </div>
        
        <h2 style="color: #fff; margin-bottom: 20px;">New Booking Request!</h2>
        
        <p style="color: #999; line-height: 1.6;">
          Hi ${talentName}, you have a new booking request from <strong style="color: #fff;">${clientName}</strong>.
        </p>
        
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="color: #999; margin: 0 0 10px 0;">Booking Amount</p>
          <p style="color: #df2531; font-size: 24px; font-weight: bold; margin: 0;">
            ${bookingAmount.toLocaleString()} coins
          </p>
        </div>
        
        <p style="color: #999; line-height: 1.6;">
          Please review and respond to this booking request as soon as possible.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nego.app'}/dashboard/bookings/${bookingId}" 
             style="display: inline-block; background: #df2531; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Booking
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 40px;">
          © ${new Date().getFullYear()} Nego. All rights reserved.
        </p>
      </div>
    `,
  }),

  // Booking status update for client
  bookingUpdate: (clientName: string, talentName: string, status: string, bookingId: string) => {
    const statusMessages: Record<string, { color: string; message: string }> = {
      confirmed: { color: '#22c55e', message: 'Your booking has been accepted!' },
      cancelled: { color: '#ef4444', message: 'Your booking has been declined.' },
      completed: { color: '#3b82f6', message: 'Your booking has been completed!' },
    }
    
    const statusInfo = statusMessages[status] || { color: '#999', message: 'Your booking status has been updated.' }
    
    return {
      subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - ${talentName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 32px; margin: 0;">
              <span style="color: #fff;">NEGO</span><span style="color: #df2531;">.</span>
            </h1>
          </div>
          
          <h2 style="color: ${statusInfo.color}; margin-bottom: 20px;">${statusInfo.message}</h2>
          
          <p style="color: #999; line-height: 1.6;">
            Hi ${clientName}, ${talentName} has ${status === 'confirmed' ? 'accepted' : status} your booking.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nego.app'}/dashboard/bookings/${bookingId}" 
               style="display: inline-block; background: #df2531; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Booking
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 40px;">
            © ${new Date().getFullYear()} Nego. All rights reserved.
          </p>
        </div>
      `,
    }
  },
}

// Send email function
export async function sendEmail(to: string, template: { subject: string; html: string }) {
  // Check if API key is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
    console.log('Resend API key not configured. Skipping email send.')
    return { success: false, error: 'Email not configured' }
  }
  
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject: template.subject,
      html: template.html,
    })

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
