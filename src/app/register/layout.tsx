import { Metadata } from 'next'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata: Metadata = generateOpenGraphMetadata({
    title: 'Create Account - Nego',
    description: 'Join Nego as a client or talent. Connect with verified, elite talent or showcase your services.',
    url: `${APP_URL}/register`,
    type: 'website',
    pageType: 'auth',
})

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
