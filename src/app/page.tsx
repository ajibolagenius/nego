import { unstable_cache } from 'next/cache'
import {
    HeroSection,
    AboutSection,
    TalentSection,
    PremiumSection,
    Footer
} from '@/components/landing'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'
import { createApiClient } from '@/lib/supabase/api'
import type { PublicTalentPreview } from '@/components/landing/TalentSection'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const revalidate = 300

const getCachedLandingTalents = unstable_cache(
    async (): Promise<PublicTalentPreview[]> => {
        try {
            const supabase = createApiClient()
            const { data, error } = await supabase
                .from('profiles')
                .select('id, role, username, display_name, avatar_url, location, is_verified, status, starting_price')
                .eq('role', 'talent')
                .limit(8)

            if (error || !data) {
                return []
            }
            return data as PublicTalentPreview[]
        } catch {
            return []
        }
    },
    ['landing-talents-v1'],
    { revalidate: 300, tags: ['talents'] }
)

export const metadata = generateOpenGraphMetadata({
    title: "Nego - Premium Managed Talent Marketplace",
    description: "The premier managed marketplace connecting discerning clients with verified, elite talent. Excellence with discretion.",
    url: APP_URL,
    type: 'website',
    pageType: 'default',
})

export default async function Home() {
    const initialTalents = await getCachedLandingTalents()

    return (
        <main className="min-h-screen bg-black">
            <HeroSection />
            <AboutSection />
            <TalentSection initialTalents={initialTalents} />
            <PremiumSection />
            <Footer />
        </main>
    )
}
