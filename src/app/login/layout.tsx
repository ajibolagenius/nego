import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Nego',
  description: 'Sign in to your Nego account',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
