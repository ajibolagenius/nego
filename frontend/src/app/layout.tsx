import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Nego - Premium Managed Talent Marketplace",
  description: "The premier managed marketplace connecting discerning clients with verified, elite talent. Excellence with discretion.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
