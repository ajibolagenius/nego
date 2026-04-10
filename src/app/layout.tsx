import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AppHeader } from "@/components/AppHeader"
import { NetworkStatus } from "@/components/NetworkStatus"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"
import { fontVariables } from "@/lib/fonts"
import { generateOpenGraphMetadata } from "@/lib/og-metadata"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

const baseMetadata = generateOpenGraphMetadata({
    title: "Nego - Premium Managed Talent Marketplace",
    description: "The premier managed marketplace connecting discerning clients with verified, elite talent. Excellence with discretion.",
    url: APP_URL,
    type: 'website',
    pageType: 'default',
})

export const metadata: Metadata = {
    ...baseMetadata,
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/apple-icon.png" },
            { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
        ],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Nego",
    },
    other: {
        "mobile-web-app-capable": "yes",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#000000" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
}

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { ROLE_PREVIEW_COOKIE, PreviewRole } from "@/lib/admin/role-preview"
import { RolePreviewSwitcher } from "@/components/admin/RolePreviewSwitcher"

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch profile if user is logged in
    let profile = null
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        profile = data
    }

    const isAdmin = profile?.role === 'admin'
    const cookieStore = await cookies()
    const previewRole = cookieStore.get(ROLE_PREVIEW_COOKIE)?.value as PreviewRole || 'admin'

    return (
        <html lang="en" data-scroll-behavior="smooth" className={fontVariables}>
            <head>
                <meta name="apple-mobile-web-app-title" content="Nego" />
                <meta name="application-name" content="Nego" />
                <meta name="format-detection" content="telephone=no" />
                <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
            </head>
            <body className="antialiased bg-black min-h-screen">
                <ServiceWorkerRegistration />
                <NetworkStatus />
                <AppHeader />
                {children}
                {isAdmin && <RolePreviewSwitcher currentRole={previewRole} />}
                <PWAInstallPrompt />
                <PWAUpdatePrompt />
            </body>
        </html>
    )
}
