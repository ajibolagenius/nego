import Link from 'next/link'
import { ArrowLeft, Cookie, ShieldCheck, ChartLine, Megaphone } from '@phosphor-icons/react/dist/ssr'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Cookie Policy - Nego',
    description: 'Learn about how Nego uses cookies to enhance your experience and improve our platform',
    url: `${APP_URL}/cookies`,
    type: 'website',
    pageType: 'legal',
})

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-black pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors animate-fade-in-up"
                    aria-label="Back to home"
                >
                    <ArrowLeft size={20} weight="duotone" aria-hidden="true" />
                    <span>Back to Home</span>
                </Link>

                {/* Header */}
                <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <p className="text-[#df2531] tracking-[0.2em] uppercase text-xs font-medium mb-4">Legal</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Cookie Policy</h1>
                    <p className="text-white/50">Last updated: January 2026</p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* What Are Cookies */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Cookie size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">1. What Are Cookies?</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            Cookies are small text files stored on your device when you visit a website. They help websites
                            remember your preferences and improve your browsing experience.
                        </p>
                    </section>

                    {/* How We Use Cookies */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">2. How We Use Cookies</h2>
                        </div>
                        <p className="text-white/70 mb-4 leading-relaxed">Nego uses cookies for the following purposes:</p>

                        <div className="space-y-4 mt-6">
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-2">Essential Cookies</h3>
                                <p className="text-white/60 text-sm mb-3 leading-relaxed">Required for the platform to function properly:</p>
                                <ul className="list-disc pl-6 space-y-1.5 text-white/70 text-sm">
                                    <li>Authentication and session management</li>
                                    <li>Security features</li>
                                    <li>Load balancing</li>
                                </ul>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-2">Functional Cookies</h3>
                                <p className="text-white/60 text-sm mb-3 leading-relaxed">Enhance your experience:</p>
                                <ul className="list-disc pl-6 space-y-1.5 text-white/70 text-sm">
                                    <li>Remember your preferences</li>
                                    <li>Language settings</li>
                                    <li>Recently viewed profiles</li>
                                </ul>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <ChartLine size={20} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    <h3 className="text-xl font-semibold text-white">Analytics Cookies</h3>
                                </div>
                                <p className="text-white/60 text-sm mb-3 leading-relaxed">Help us understand how users interact with our platform:</p>
                                <ul className="list-disc pl-6 space-y-1.5 text-white/70 text-sm">
                                    <li>Page views and navigation patterns</li>
                                    <li>Feature usage statistics</li>
                                    <li>Error tracking</li>
                                </ul>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Megaphone size={20} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                                    <h3 className="text-xl font-semibold text-white">Marketing Cookies</h3>
                                </div>
                                <p className="text-white/60 text-sm mb-3 leading-relaxed">Used for promotional purposes:</p>
                                <ul className="list-disc pl-6 space-y-1.5 text-white/70 text-sm">
                                    <li>Personalized recommendations</li>
                                    <li>Advertising effectiveness</li>
                                    <li>Social media integration</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Cookies We Use */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Cookies We Use</h2>

                        <div className="overflow-x-auto mt-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 text-white font-semibold">Cookie Name</th>
                                        <th className="text-left py-3 text-white font-semibold">Purpose</th>
                                        <th className="text-left py-3 text-white font-semibold">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 text-white/70">sb-access-token</td>
                                        <td className="py-3 text-white/70">Authentication</td>
                                        <td className="py-3 text-white/70">1 hour</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 text-white/70">sb-refresh-token</td>
                                        <td className="py-3 text-white/70">Session refresh</td>
                                        <td className="py-3 text-white/70">7 days</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 text-white/70">nego_preferences</td>
                                        <td className="py-3 text-white/70">User preferences</td>
                                        <td className="py-3 text-white/70">1 year</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 text-white/70">_ga</td>
                                        <td className="py-3 text-white/70">Google Analytics</td>
                                        <td className="py-3 text-white/70">2 years</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Third-Party Cookies */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Cookies</h2>
                        <p className="text-white/70 mb-4 leading-relaxed">
                            We may use third-party services that set their own cookies:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed">
                            <li><strong className="text-white">Supabase:</strong> Authentication and database services</li>
                            <li><strong className="text-white">Google Analytics:</strong> Website analytics</li>
                            <li><strong className="text-white">Paystack:</strong> Payment processing</li>
                        </ul>
                        <p className="mt-4 text-white/70 leading-relaxed">
                            These third parties have their own privacy policies governing cookie usage.
                        </p>
                    </section>

                    {/* Managing Cookies */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Managing Cookies</h2>
                        <p className="text-white/70 mb-4 leading-relaxed">
                            You can control cookies through your browser settings:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed mb-4">
                            <li><strong className="text-white">Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                            <li><strong className="text-white">Firefox:</strong> Options → Privacy & Security → Cookies</li>
                            <li><strong className="text-white">Safari:</strong> Preferences → Privacy → Cookies</li>
                            <li><strong className="text-white">Edge:</strong> Settings → Privacy → Cookies</li>
                        </ul>
                        <div className="mt-4 p-4 bg-[#df2531]/10 rounded-xl border border-[#df2531]/20">
                            <p className="text-white/80 text-sm leading-relaxed">
                                <strong className="text-white">Note:</strong> Disabling essential cookies may affect platform functionality,
                                including the ability to log in or make bookings.
                            </p>
                        </div>
                    </section>

                    {/* Do Not Track */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Do Not Track</h2>
                        <p className="text-white/70 leading-relaxed">
                            Some browsers offer a &quot;Do Not Track&quot; feature. We currently do not respond to DNT signals,
                            but we respect your cookie preferences set through our platform.
                        </p>
                    </section>

                    {/* Updates */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Updates to This Policy</h2>
                        <p className="text-white/70 leading-relaxed">
                            We may update this Cookie Policy as our practices change. The &quot;Last updated&quot; date at the
                            top indicates when the policy was last revised.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
                        <p className="text-white/70 leading-relaxed">
                            For questions about our cookie practices, contact us at{' '}
                            <a href="mailto:privacy@nego.com" className="text-[#df2531] hover:underline">privacy@nego.com</a>
                        </p>
                    </section>
                </div>

                {/* Footer Links */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6 animate-fade-in-up" style={{ animationDelay: '1s' }}>
                    <Link href="/terms" className="text-white/50 hover:text-white transition-colors" aria-label="Terms & Conditions">
                        Terms & Conditions
                    </Link>
                    <Link href="/privacy" className="text-white/50 hover:text-white transition-colors" aria-label="Privacy Policy">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </main>
    )
}
