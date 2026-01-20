import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Database, Lock, Globe, User, Eye } from '@phosphor-icons/react/dist/ssr'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Privacy Policy - Nego',
    description: 'Learn how Nego protects your privacy and handles your personal information',
    url: `${APP_URL}/privacy`,
    image: `${APP_URL}/og-image.png`,
    type: 'website',
})

export default function PrivacyPage() {
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
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Privacy Policy</h1>
                    <p className="text-white/50">Last updated: January 2026</p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Introduction */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            Nego (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
                            explains how we collect, use, disclose, and safeguard your information when you use our platform.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Database size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">2. Information We Collect</h2>
                        </div>

                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-3">Personal Information</h3>
                                <ul className="list-disc pl-6 space-y-1.5 text-white/70 text-sm leading-relaxed">
                                    <li>Name and contact information (email, phone)</li>
                                    <li>Account credentials</li>
                                    <li>Payment information</li>
                                    <li>Profile photos and media</li>
                                    <li>Verification documents (ID, selfie)</li>
                                    <li>Location data (with consent)</li>
                                </ul>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-3">Automatically Collected Information</h3>
                                <ul className="list-disc pl-6 space-y-1.5 text-white/70 text-sm leading-relaxed">
                                    <li>Device information (type, OS, browser)</li>
                                    <li>IP address and location</li>
                                    <li>Usage data and analytics</li>
                                    <li>Cookies and similar technologies</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* How We Use */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                        <p className="text-white/70 mb-4 leading-relaxed">We use collected information to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed">
                            <li>Provide and maintain our services</li>
                            <li>Process transactions and bookings</li>
                            <li>Verify user identities</li>
                            <li>Communicate with you about your account</li>
                            <li>Improve our platform and user experience</li>
                            <li>Ensure safety and prevent fraud</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    {/* Information Sharing */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing</h2>
                        <p className="text-white/70 mb-4 leading-relaxed">We may share your information with:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed mb-4">
                            <li><strong className="text-white">Other Users:</strong> Limited profile information visible to facilitate connections</li>
                            <li><strong className="text-white">Service Providers:</strong> Payment processors, cloud hosting, analytics</li>
                            <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect rights</li>
                            <li><strong className="text-white">Business Transfers:</strong> In case of merger, acquisition, or sale</li>
                        </ul>
                        <p className="text-white/70 leading-relaxed">
                            We do <strong className="text-white">not</strong> sell your personal information to third parties for marketing purposes.
                        </p>
                    </section>

                    {/* Data Security */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Lock size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">5. Data Security</h2>
                        </div>
                        <p className="text-white/70 mb-4 leading-relaxed">
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed mb-4">
                            <li>Encryption in transit and at rest</li>
                            <li>Secure authentication systems</li>
                            <li>Regular security audits</li>
                            <li>Access controls and monitoring</li>
                        </ul>
                        <p className="text-white/70 leading-relaxed">
                            However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </section>

                    {/* Data Retention */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
                        <p className="text-white/70 leading-relaxed">
                            We retain your information for as long as your account is active or as needed to provide services.
                            After account deletion, we may retain certain data for legal compliance for up to 7 years.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <User size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">7. Your Rights</h2>
                        </div>
                        <p className="text-white/70 mb-4 leading-relaxed">You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed mb-4">
                            <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
                            <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
                            <li><strong className="text-white">Deletion:</strong> Request deletion of your account and data</li>
                            <li><strong className="text-white">Portability:</strong> Receive your data in a structured format</li>
                            <li><strong className="text-white">Objection:</strong> Object to certain processing activities</li>
                            <li><strong className="text-white">Withdraw Consent:</strong> Where processing is based on consent</li>
                        </ul>
                        <p className="text-white/70 leading-relaxed">
                            To exercise these rights, contact us at{' '}
                            <a href="mailto:privacy@nego.com" className="text-[#df2531] hover:underline">privacy@nego.com</a>
                        </p>
                    </section>

                    {/* Cookies */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Cookies</h2>
                        <p className="text-white/70 leading-relaxed">
                            We use cookies and similar technologies to enhance your experience. For details, see our{' '}
                            <Link href="/cookies" className="text-[#df2531] hover:underline">Cookie Policy</Link>.
                        </p>
                    </section>

                    {/* Third-Party Links */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Globe size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">9. Third-Party Links</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            Our platform may contain links to third-party websites. We are not responsible for the privacy
                            practices of these external sites.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Children&apos;s Privacy</h2>
                        <p className="text-white/70 leading-relaxed">
                            Nego is not intended for users under 18. We do not knowingly collect information from minors.
                            If we discover such collection, we will delete the data immediately.
                        </p>
                    </section>

                    {/* International Transfers */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">11. International Transfers</h2>
                        <p className="text-white/70 leading-relaxed">
                            Your information may be transferred and processed in countries other than your own.
                            We ensure appropriate safeguards are in place for such transfers.
                        </p>
                    </section>

                    {/* Changes */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.3s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
                        <p className="text-white/70 leading-relaxed">
                            We may update this Privacy Policy periodically. We will notify you of significant changes
                            via email or platform notification.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.4s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Eye size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">13. Contact Us</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            For privacy-related inquiries, contact our Data Protection Officer at{' '}
                            <a href="mailto:privacy@nego.com" className="text-[#df2531] hover:underline">privacy@nego.com</a>
                        </p>
                    </section>
                </div>

                {/* Footer Links */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6 animate-fade-in-up" style={{ animationDelay: '1.5s' }}>
                    <Link href="/terms" className="text-white/50 hover:text-white transition-colors" aria-label="Terms & Conditions">
                        Terms & Conditions
                    </Link>
                    <Link href="/cookies" className="text-white/50 hover:text-white transition-colors" aria-label="Cookie Policy">
                        Cookie Policy
                    </Link>
                </div>
            </div>
        </main>
    )
}
