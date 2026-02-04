import { ArrowLeft, CheckCircle, User, ShieldCheck, CreditCard, Calendar, FileText, Warning, XCircle } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: 'Terms & Conditions - Nego',
    description: 'Terms and Conditions for using the Nego platform',
    url: `${APP_URL}/terms`,
    type: 'website',
    pageType: 'legal',
})

export default function TermsPage() {
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
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Terms & Conditions</h1>
                    <p className="text-white/50">Last updated: January 2026</p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Acceptance */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            By accessing and using Nego (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions.
                            If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    {/* Eligibility */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <User size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">2. Eligibility</h2>
                        </div>
                        <p className="text-white/70 mb-4 leading-relaxed">You must be at least 18 years of age to use this Platform. By using Nego, you represent and warrant that:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed">
                            <li>You are at least 18 years old</li>
                            <li>You have the legal capacity to enter into a binding agreement</li>
                            <li>You are not prohibited from using the Platform under applicable laws</li>
                            <li>All information you provide is accurate and truthful</li>
                        </ul>
                    </section>

                    {/* Account Registration */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
                        <p className="text-white/70 mb-4 leading-relaxed">
                            To access certain features, you must create an account. You are responsible for maintaining the
                            confidentiality of your account credentials and for all activities under your account.
                        </p>
                        <p className="text-white/70 mb-3 leading-relaxed">You agree to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed">
                            <li>Provide accurate and complete registration information</li>
                            <li>Keep your password secure and confidential</li>
                            <li>Notify us immediately of any unauthorized access</li>
                            <li>Not share your account with others</li>
                        </ul>
                    </section>

                    {/* User Conduct */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">4. User Conduct</h2>
                        <p className="text-white/70 mb-4 leading-relaxed">When using Nego, you agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed">
                            <li>Violate any applicable laws or regulations</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Post false, misleading, or fraudulent content</li>
                            <li>Engage in any illegal activities through the Platform</li>
                            <li>Attempt to circumvent security measures</li>
                            <li>Use automated systems without permission</li>
                        </ul>
                    </section>

                    {/* Payments */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <CreditCard size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">5. Payments and Fees</h2>
                        </div>
                        <p className="text-white/70 mb-4 leading-relaxed">
                            Nego operates on a token-based system. All payments are processed securely through our payment partners.
                            Fees are non-refundable unless otherwise stated.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed">
                            <li>Token purchases are final and non-refundable</li>
                            <li>Service fees vary based on the selected services</li>
                            <li>Payments are held in escrow until service completion</li>
                            <li>Disputes must be raised within 24 hours</li>
                        </ul>
                    </section>

                    {/* Booking */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">6. Booking and Cancellation</h2>
                        </div>
                        <p className="text-white/70 mb-4 leading-relaxed">
                            Bookings are subject to availability and confirmation by the talent. Cancellation policies apply
                            based on timing:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70 leading-relaxed">
                            <li>Free cancellation up to 24 hours before scheduled time</li>
                            <li>50% fee for cancellations within 24 hours</li>
                            <li>No refund for no-shows</li>
                        </ul>
                    </section>

                    {/* Verification */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">7. Verification Process</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            For safety and security, we require identity verification before certain services.
                            This may include photo ID and selfie verification. All verification data is handled
                            in accordance with our Privacy Policy.
                        </p>
                    </section>

                    {/* Intellectual Property */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <FileText size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">8. Intellectual Property</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            All content on Nego, including logos, designs, and text, is owned by Nego or its licensors.
                            You may not reproduce, distribute, or create derivative works without permission.
                        </p>
                    </section>

                    {/* Limitation of Liability */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Warning size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">9. Limitation of Liability</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            Nego is a platform that connects clients with talent. We are not responsible for the actions
                            of users or the quality of services provided. Our liability is limited to the maximum extent
                            permitted by law.
                        </p>
                    </section>

                    {/* Termination */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <XCircle size={24} weight="duotone" className="text-[#df2531]" aria-hidden="true" />
                            <h2 className="text-2xl font-bold text-white">10. Termination</h2>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            We reserve the right to suspend or terminate your account at any time for violations of these
                            terms or for any other reason at our discretion.
                        </p>
                    </section>

                    {/* Changes */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
                        <p className="text-white/70 leading-relaxed">
                            We may update these Terms at any time. Continued use of the Platform after changes constitutes
                            acceptance of the new terms.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#df2531]/30 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '1.3s' }}>
                        <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
                        <p className="text-white/70 leading-relaxed">
                            For questions about these Terms, please contact us at{' '}
                            <a href="mailto:legal@negoempire.live" className="text-[#df2531] hover:underline">legal@negoempire.live</a>
                        </p>
                    </section>
                </div>

                {/* Footer Links */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6 animate-fade-in-up" style={{ animationDelay: '1.4s' }}>
                    <Link href="/privacy" className="text-white/50 hover:text-white transition-colors" aria-label="Privacy Policy">
                        Privacy Policy
                    </Link>
                    <Link href="/cookies" className="text-white/50 hover:text-white transition-colors" aria-label="Cookie Policy">
                        Cookie Policy
                    </Link>
                </div>
            </div>
        </main>
    )
}
