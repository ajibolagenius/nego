import { Playfair, DM_Sans, Cinzel_Decorative } from 'next/font/google'

// Heading font - Playfair
export const playfair = Playfair({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-playfair',
    weight: ['300', '400', '500', '600', '700', '800', '900'],
})

// Body font - DM Sans
export const dmSans = DM_Sans({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-dm-sans',
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

// Logo font - Cinzel Decorative
export const cinzelDecorative = Cinzel_Decorative({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-logo',
    weight: ['400', '700', '900'],
})

// Combined font class names for layout
export const fontVariables = `${playfair.variable} ${dmSans.variable} ${cinzelDecorative.variable}`
