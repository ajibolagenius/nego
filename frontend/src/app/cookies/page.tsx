import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'Cookie Policy - Nego',
  description: 'Cookie Policy for the Nego platform',
}

export default function CookiesPage() {
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
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Cookie Policy</h1>
          <p className="text-white/50">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-8 text-white/70">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device when you visit a website. They help websites 
                remember your preferences and improve your browsing experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Cookies</h2>
              <p>Nego uses cookies for the following purposes:</p>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Essential Cookies</h3>
              <p>Required for the platform to function properly:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Authentication and session management</li>
                <li>Security features</li>
                <li>Load balancing</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Functional Cookies</h3>
              <p>Enhance your experience:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Remember your preferences</li>
                <li>Language settings</li>
                <li>Recently viewed profiles</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Analytics Cookies</h3>
              <p>Help us understand how users interact with our platform:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Page views and navigation patterns</li>
                <li>Feature usage statistics</li>
                <li>Error tracking</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Marketing Cookies</h3>
              <p>Used for promotional purposes:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Personalized recommendations</li>
                <li>Advertising effectiveness</li>
                <li>Social media integration</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Cookies We Use</h2>
              
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-white">Cookie Name</th>
                      <th className="text-left py-3 text-white">Purpose</th>
                      <th className="text-left py-3 text-white">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr>
                      <td className="py-3">sb-access-token</td>
                      <td className="py-3">Authentication</td>
                      <td className="py-3">1 hour</td>
                    </tr>
                    <tr>
                      <td className="py-3">sb-refresh-token</td>
                      <td className="py-3">Session refresh</td>
                      <td className="py-3">7 days</td>
                    </tr>
                    <tr>
                      <td className="py-3">nego_preferences</td>
                      <td className="py-3">User preferences</td>
                      <td className="py-3">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-3">_ga</td>
                      <td className="py-3">Google Analytics</td>
                      <td className="py-3">2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Cookies</h2>
              <p>
                We may use third-party services that set their own cookies:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Supabase:</strong> Authentication and database services</li>
                <li><strong>Google Analytics:</strong> Website analytics</li>
                <li><strong>Paystack:</strong> Payment processing</li>
              </ul>
              <p className="mt-4">
                These third parties have their own privacy policies governing cookie usage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Managing Cookies</h2>
              <p>
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
              </ul>
              <p className="mt-4 p-4 bg-[#df2531]/10 rounded-xl border border-[#df2531]/20">
                <strong className="text-white">Note:</strong> Disabling essential cookies may affect platform functionality, 
                including the ability to log in or make bookings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Do Not Track</h2>
              <p>
                Some browsers offer a &quot;Do Not Track&quot; feature. We currently do not respond to DNT signals, 
                but we respect your cookie preferences set through our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy as our practices change. The &quot;Last updated&quot; date at the 
                top indicates when the policy was last revised.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
              <p>
                For questions about our cookie practices, contact us at{' '}
                <a href="mailto:privacy@nego.com" className="text-[#df2531] hover:underline">privacy@nego.com</a>
              </p>
            </section>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6">
          <Link href="/terms" className="text-white/50 hover:text-white transition-colors">Terms & Conditions</Link>
          <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </main>
  )
}
