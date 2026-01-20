import {
    HeroSection,
    AboutSection,
    TalentSection,
    PremiumSection,
    Footer
} from '@/components/landing'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata = generateOpenGraphMetadata({
    title: "Nego - Premium Managed Talent Marketplace",
    description: "The premier managed marketplace connecting discerning clients with verified, elite talent. Excellence with discretion.",
    url: APP_URL,
    image: `${APP_URL}/og-image.png`,
    type: 'website',
})

export default function Home() {
    return (
        <main className="min-h-screen bg-black">
            <HeroSection />
            <AboutSection />
            <TalentSection />
            <PremiumSection />
            <Footer />
        </main>
    )
}
