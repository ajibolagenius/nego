import { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'
const SITE_NAME = 'Nego'

export type PageType = 'default' | 'dashboard' | 'auth' | 'legal' | 'admin' | 'talent'

export interface OpenGraphMetadataOptions {
    title: string
    description: string
    url?: string
    image?: string
    type?: 'website' | 'profile' | 'article'
    siteName?: string
    locale?: string
    pageType?: PageType
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
        pageType = 'default',
    } = options

    // Generate dynamic OG image URL based on page type
    let ogImage: string
    if (image) {
        ogImage = image
    } else {
        // Build dynamic OG image URL with query parameters
        const ogParams = new URLSearchParams({
            title: title.substring(0, 100), // Limit title length
            description: description.substring(0, 200), // Limit description length
            type: pageType,
        })
        ogImage = `${APP_URL}/api/og?${ogParams.toString()}`
    }

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
    _talentImage?: string | null,
    username?: string | null,
    talentId?: string | null
): Metadata {
    const talentUrl = username ? `${APP_URL}/t/${username}` : undefined

    // Generate dynamic talent OG image URL
    const ogParams = new URLSearchParams()
    if (username) {
        ogParams.set('username', username)
    } else if (talentId) {
        ogParams.set('id', talentId)
    }
    const ogImage = `${APP_URL}/api/og/talent?${ogParams.toString()}`

    return generateOpenGraphMetadata({
        title: `${talentName} - Nego`,
        description: `View ${talentName}'s profile and services on Nego - Premium Managed Talent Marketplace`,
        url: talentUrl,
        image: ogImage,
        type: 'profile',
        pageType: 'talent',
    })
}
