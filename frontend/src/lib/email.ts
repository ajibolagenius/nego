import { Resend } from 'resend'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

// Sender email - use verified domain or Resend's test domain
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'Nego <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nego.app'

// Shared email styles
const styles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: linear-gradient(180deg, #0a0a0a 0%, #111111 100%);
    color: #ffffff;
  `,
  header: `
    text-align: center;
    padding: 40px 40px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  `,
  logo: `
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
  `,
  content: `
    padding: 40px;
  `,
  heading: `
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 16px;
    color: #ffffff;
  `,
  text: `
    font-size: 15px;
    line-height: 1.6;
    color: rgba(255,255,255,0.7);
    margin-bottom: 24px;
  `,
  button: `
    display: inline-block;
    background: #df2531;
    color: #ffffff !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
  `,
  card: `
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 24px;
    margin: 24px 0;
  `,
  footer: `
    text-align: center;
    padding: 32px 40px;
    border-top: 1px solid rgba(255,255,255,0.05);
  `,
  footerText: `
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    margin: 0;
  `,
  highlight: `
    color: #df2531;
    font-weight: 600;
  `,
  amount: `
    font-size: 32px;
    font-weight: 700;
    color: #df2531;
    margin: 8px 0;
  `,
}

// Base template wrapper
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nego</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000;">
  <div style="${styles.container}">
    <!-- Header -->
    <div style="${styles.header}">
      <div style="${styles.logo}">
        <span style="color: #ffffff;">NEGO</span><span style="color: #df2531;">.</span>
      </div>
    </div>
    
    <!-- Content -->
    <div style="${styles.content}">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="${styles.footer}">
      <p style="${styles.footerText}">
        © ${new Date().getFullYear()} Nego. All rights reserved.
      </p>
      <p style="${styles.footerText}; margin-top: 8px;">
        Excellence with discretion.
      </p>
    </div>
  </div>
</body>
</html>
`

// Email templates
export const emailTemplates = {
  // Welcome email for new users
  welcome: (name: string, role: string) => ({
    subject: 'Welcome to Nego! 🎉',
    html: emailWrapper(`
      <h1 style="${styles.heading}">Welcome, ${name}!</h1>
      
      <p style="${styles.text}">
        Thank you for joining Nego as a <span style="${styles.highlight}">${role}</span>.
      </p>
      
      <div style="${styles.card}">
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 12px 0;">
          ${role === 'talent' ? 'NEXT STEPS' : 'GET STARTED'}
        </p>
        <p style="color: #ffffff; font-size: 15px; margin: 0; line-height: 1.6;">
          ${role === 'talent' 
            ? '1. Complete your profile<br>2. Add your services<br>3. Start accepting bookings'
            : '1. Browse our elite talent<br>2. Add coins to your wallet<br>3. Book your experience'}
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/dashboard" style="${styles.button}">
          Go to Dashboard →
        </a>
      </div>
      
      <p style="${styles.text}">
        If you have any questions, our support team is here to help.
      </p>
    `),
  }),

  // New booking notification for talent
  newBooking: (talentName: string, clientName: string, bookingAmount: number, bookingId: string) => ({
    subject: '🔔 New Booking Request!',
    html: emailWrapper(`
      <h1 style="${styles.heading}">New Booking Request!</h1>
      
      <p style="${styles.text}">
        Hi ${talentName}, you have a new booking request from <span style="${styles.highlight}">${clientName}</span>.
      </p>
      
      <div style="${styles.card}">
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 8px 0;">
          BOOKING AMOUNT
        </p>
        <p style="${styles.amount}">
          ${bookingAmount.toLocaleString()} coins
        </p>
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0;">
          ≈ ₦${bookingAmount.toLocaleString()}
        </p>
      </div>
      
      <p style="${styles.text}">
        Please review and respond to this booking request as soon as possible.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/dashboard/bookings/${bookingId}" style="${styles.button}">
          View Booking →
        </a>
      </div>
    `),
  }),

  // Booking status update for client
  bookingUpdate: (clientName: string, talentName: string, status: string, bookingId: string) => {
    const statusConfig: Record<string, { color: string; emoji: string; message: string; cta: string }> = {
      confirmed: { 
        color: '#22c55e', 
        emoji: '✅', 
        message: 'Great news! Your booking has been accepted.',
        cta: 'View Booking Details'
      },
      cancelled: { 
        color: '#ef4444', 
        emoji: '❌', 
        message: 'Unfortunately, your booking has been declined.',
        cta: 'Browse Other Talent'
      },
      completed: { 
        color: '#3b82f6', 
        emoji: '🎉', 
        message: 'Your booking has been completed. We hope you had a great experience!',
        cta: 'Leave a Review'
      },
    }
    
    const config = statusConfig[status] || { color: '#999', emoji: '📋', message: 'Your booking status has been updated.', cta: 'View Booking' }
    
    return {
      subject: `${config.emoji} Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - ${talentName}`,
      html: emailWrapper(`
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px;">${config.emoji}</span>
        </div>
        
        <h1 style="${styles.heading}; text-align: center; color: ${config.color};">
          Booking ${status.charAt(0).toUpperCase() + status.slice(1)}
        </h1>
        
        <p style="${styles.text}; text-align: center;">
          Hi ${clientName}, ${config.message}
        </p>
        
        <div style="${styles.card}; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 8px 0;">
            TALENT
          </p>
          <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">
            ${talentName}
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/dashboard/bookings/${bookingId}" style="${styles.button}">
            ${config.cta} →
          </a>
        </div>
      `),
    }
  },

  // Withdrawal approved notification
  withdrawalApproved: (talentName: string, amount: number) => ({
    subject: '💰 Withdrawal Approved!',
    html: emailWrapper(`
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">💰</span>
      </div>
      
      <h1 style="${styles.heading}; text-align: center; color: #22c55e;">
        Withdrawal Approved!
      </h1>
      
      <p style="${styles.text}; text-align: center;">
        Hi ${talentName}, your withdrawal request has been approved.
      </p>
      
      <div style="${styles.card}; text-align: center;">
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 8px 0;">
          AMOUNT
        </p>
        <p style="${styles.amount}">
          ${amount.toLocaleString()} coins
        </p>
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0;">
          Processing within 24-48 hours
        </p>
      </div>
      
      <p style="${styles.text}; text-align: center;">
        The funds will be transferred to your registered bank account shortly.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/dashboard/talent?tab=withdrawals" style="${styles.button}">
          View Status →
        </a>
      </div>
    `),
  }),

  // Withdrawal rejected notification
  withdrawalRejected: (talentName: string, amount: number, reason?: string) => ({
    subject: '⚠️ Withdrawal Request Update',
    html: emailWrapper(`
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">⚠️</span>
      </div>
      
      <h1 style="${styles.heading}; text-align: center; color: #f59e0b;">
        Withdrawal Not Processed
      </h1>
      
      <p style="${styles.text}; text-align: center;">
        Hi ${talentName}, unfortunately your withdrawal request for <span style="${styles.highlight}">${amount.toLocaleString()} coins</span> could not be processed.
      </p>
      
      ${reason ? `
        <div style="${styles.card}">
          <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 8px 0;">
            REASON
          </p>
          <p style="color: #ffffff; font-size: 15px; margin: 0;">
            ${reason}
          </p>
        </div>
      ` : ''}
      
      <p style="${styles.text}; text-align: center;">
        Please contact support if you have any questions.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="mailto:support@nego.app" style="${styles.button}">
          Contact Support →
        </a>
      </div>
    `),
  }),
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
