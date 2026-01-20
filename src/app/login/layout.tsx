import { Metadata } from 'next'
import { generateOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

export const metadata: Metadata = generateOpenGraphMetadata({
    title: 'Sign In - Nego',
    description: 'Sign in to your Nego account to access premium talent marketplace',
    url: `${APP_URL}/login`,
    type: 'website',
    pageType: 'auth',
})

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
