import type { Metadata } from "next"
import "./globals.css"
import { AppHeader } from "@/components/AppHeader"

export const metadata: Metadata = {
  title: "Nego - Premium Managed Talent Marketplace",
  description: "The premier managed marketplace connecting discerning clients with verified, elite talent. Excellence with discretion.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black min-h-screen">
        <AppHeader />
        {children}
      </body>
    </html>
  )
}
