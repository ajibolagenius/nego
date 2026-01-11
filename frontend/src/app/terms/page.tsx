import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'Terms & Conditions - Nego',
  description: 'Terms and Conditions for using the Nego platform',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-[#df2531] tracking-[0.2em] uppercase text-xs font-medium mb-4">Legal</p>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Terms & Conditions</h1>
          <p className="text-white/50">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-8 text-white/70">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Nego (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
              <p>You must be at least 18 years of age to use this Platform. By using Nego, you represent and warrant that:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>You are at least 18 years old</li>
                <li>You have the legal capacity to enter into a binding agreement</li>
                <li>You are not prohibited from using the Platform under applicable laws</li>
                <li>All information you provide is accurate and truthful</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
              <p>
                To access certain features, you must create an account. You are responsible for maintaining the 
                confidentiality of your account credentials and for all activities under your account.
              </p>
              <p className="mt-4">You agree to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Provide accurate and complete registration information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Not share your account with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. User Conduct</h2>
              <p>When using Nego, you agree not to:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post false, misleading, or fraudulent content</li>
                <li>Engage in any illegal activities through the Platform</li>
                <li>Attempt to circumvent security measures</li>
                <li>Use automated systems without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Payments and Fees</h2>
              <p>
                Nego operates on a token-based system. All payments are processed securely through our payment partners. 
                Fees are non-refundable unless otherwise stated.
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Token purchases are final and non-refundable</li>
                <li>Service fees vary based on the selected services</li>
                <li>Payments are held in escrow until service completion</li>
                <li>Disputes must be raised within 24 hours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Booking and Cancellation</h2>
              <p>
                Bookings are subject to availability and confirmation by the talent. Cancellation policies apply 
                based on timing:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Free cancellation up to 24 hours before scheduled time</li>
                <li>50% fee for cancellations within 24 hours</li>
                <li>No refund for no-shows</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Verification Process</h2>
              <p>
                For safety and security, we require identity verification before certain services. 
                This may include photo ID and selfie verification. All verification data is handled 
                in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
              <p>
                All content on Nego, including logos, designs, and text, is owned by Nego or its licensors. 
                You may not reproduce, distribute, or create derivative works without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
              <p>
                Nego is a platform that connects clients with talent. We are not responsible for the actions 
                of users or the quality of services provided. Our liability is limited to the maximum extent 
                permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations of these 
                terms or for any other reason at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
              <p>
                We may update these Terms at any time. Continued use of the Platform after changes constitutes 
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
              <p>
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@nego.com" className="text-[#df2531] hover:underline">legal@nego.com</a>
              </p>
            </section>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6">
          <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/cookies" className="text-white/50 hover:text-white transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </main>
  )
}
