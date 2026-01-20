import { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'
const SITE_NAME = 'Nego'

export interface OpenGraphMetadataOptions {
    title: string
    description: string
    url?: string
    image?: string
    type?: 'website' | 'profile' | 'article'
    siteName?: string
    locale?: string
}

/**
 * Generates comprehensive Open Graph and Twitter Card metadata
 */
export function generateOpenGraphMetadata(options: OpenGraphMetadataOptions): Metadata {
    const {
        title,
        description,
        url,
        image,
        type = 'website',
        siteName = SITE_NAME,
        locale = 'en_US',
    } = options

    // Default Open Graph image - use logo or create a default OG image
    const ogImage = image || `${APP_URL}/og-image.png`
    const ogUrl = url || APP_URL

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: ogUrl,
            siteName,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            locale,
            type,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
        alternates: {
            canonical: ogUrl,
        },
    }
}

/**
 * Generates Open Graph metadata for talent profiles
 */
export function generateTalentOpenGraphMetadata(
    talentName: string,
    talentImage?: string | null,
    username?: string | null
): Metadata {
    const talentUrl = username ? `${APP_URL}/t/${username}` : undefined
    const ogImage = talentImage || `${APP_URL}/og-image.png`

    return generateOpenGraphMetadata({
        title: `${talentName} - Nego`,
        description: `View ${talentName}'s profile and services on Nego - Premium Managed Talent Marketplace`,
        url: talentUrl,
        image: ogImage,
        type: 'profile',
    })
}
