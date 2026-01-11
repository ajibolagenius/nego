import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'Privacy Policy - Nego',
  description: 'Privacy Policy for the Nego platform',
}

export default function PrivacyPage() {
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
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Privacy Policy</h1>
          <p className="text-white/50">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-8 text-white/70">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                Nego (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and contact information (email, phone)</li>
                <li>Account credentials</li>
                <li>Payment information</li>
                <li>Profile photos and media</li>
                <li>Verification documents (ID, selfie)</li>
                <li>Location data (with consent)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information (type, OS, browser)</li>
                <li>IP address and location</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p>We use collected information to:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process transactions and bookings</li>
                <li>Verify user identities</li>
                <li>Communicate with you about your account</li>
                <li>Improve our platform and user experience</li>
                <li>Ensure safety and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Other Users:</strong> Limited profile information visible to facilitate connections</li>
                <li><strong>Service Providers:</strong> Payment processors, cloud hosting, analytics</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
              </ul>
              <p className="mt-4">
                We do <strong>not</strong> sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Encryption in transit and at rest</li>
                <li>Secure authentication systems</li>
                <li>Regular security audits</li>
                <li>Access controls and monitoring</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide services. 
                After account deletion, we may retain certain data for legal compliance for up to 7 years.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
                <li><strong>Withdraw Consent:</strong> Where processing is based on consent</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@nego.com" className="text-[#df2531] hover:underline">privacy@nego.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Cookies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience. For details, see our{' '}
                <Link href="/cookies" className="text-[#df2531] hover:underline">Cookie Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Third-Party Links</h2>
              <p>
                Our platform may contain links to third-party websites. We are not responsible for the privacy 
                practices of these external sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Children&apos;s Privacy</h2>
              <p>
                Nego is not intended for users under 18. We do not knowingly collect information from minors. 
                If we discover such collection, we will delete the data immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. International Transfers</h2>
              <p>
                Your information may be transferred and processed in countries other than your own. 
                We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of significant changes 
                via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
              <p>
                For privacy-related inquiries, contact our Data Protection Officer at{' '}
                <a href="mailto:privacy@nego.com" className="text-[#df2531] hover:underline">privacy@nego.com</a>
              </p>
            </section>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6">
          <Link href="/terms" className="text-white/50 hover:text-white transition-colors">Terms & Conditions</Link>
          <Link href="/cookies" className="text-white/50 hover:text-white transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </main>
  )
}
