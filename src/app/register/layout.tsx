import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account - Nego',
  description: 'Join Nego as a client or talent',
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
