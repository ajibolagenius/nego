import type { Metadata } from "next"
import "./globals.css"
import { AppHeader } from "@/components/AppHeader"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt"
import { NetworkStatus } from "@/components/NetworkStatus"

export const metadata: Metadata = {
    title: "Nego - Premium Managed Talent Marketplace",
    description: "The premier managed marketplace connecting discerning clients with verified, elite talent. Excellence with discretion.",
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
    viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 5,
        userScalable: true,
        viewportFit: "cover",
    },
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#000000" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
    other: {
        "mobile-web-app-capable": "yes",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
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
                <PWAInstallPrompt />
                <PWAUpdatePrompt />
            </body>
        </html>
    )
}
