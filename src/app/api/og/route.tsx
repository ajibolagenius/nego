import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Font loading - using system fonts for better compatibility
const fontFamily = {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const title = searchParams.get('title') || 'Nego'
        const description = searchParams.get('description') || 'Premium Managed Talent Marketplace'
        const type = searchParams.get('type') || 'default' // default, dashboard, auth, legal, admin

        // Brand colors
        const bgColor = '#000000'
        const primaryColor = '#df2531'
        const textColor = '#ffffff'
        const textSecondary = '#a0a0a0'

        // Determine icon/emoji based on page type
        const getTypeIcon = () => {
            switch (type) {
                case 'dashboard':
                    return '📊'
                case 'auth':
                    return '🔐'
                case 'legal':
                    return '📄'
                case 'admin':
                    return '⚙️'
                case 'talent':
                    return '⭐'
                default:
                    return '✨'
            }
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bgColor,
                        backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a0a0a 50%, #000000 100%)',
                        fontFamily: fontFamily.sans,
                        position: 'relative',
                    }}
                >
                    {/* Decorative gradient overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `radial-gradient(circle at 20% 30%, ${primaryColor}15 0%, transparent 50%)`,
                        }}
                    />

                    {/* Logo/Brand */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 40,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 72,
                                fontWeight: 900,
                                color: textColor,
                                letterSpacing: '-2px',
                            }}
                        >
                            NEGO
                        </div>
                        <div
                            style={{
                                fontSize: 72,
                                fontWeight: 900,
                                color: primaryColor,
                                marginLeft: 8,
                            }}
                        >
                            .
                        </div>
                    </div>

                    {/* Type Icon */}
                    <div
                        style={{
                            fontSize: 80,
                            marginBottom: 30,
                        }}
                    >
                        {getTypeIcon()}
                    </div>

                    {/* Title */}
                    <div
                        style={{
                            fontSize: 56,
                            fontWeight: 700,
                            color: textColor,
                            textAlign: 'center',
                            maxWidth: 1000,
                            marginBottom: 24,
                            lineHeight: 1.2,
                        }}
                    >
                        {title}
                    </div>

                    {/* Description */}
                    <div
                        style={{
                            fontSize: 32,
                            color: textSecondary,
                            textAlign: 'center',
                            maxWidth: 900,
                            lineHeight: 1.4,
                        }}
                    >
                        {description}
                    </div>

                    {/* Bottom accent line */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 8,
                            background: `linear-gradient(90deg, transparent 0%, ${primaryColor} 50%, transparent 100%)`,
                        }}
                    />
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    } catch (error) {
        console.error('OG image generation error:', error)
        // Return a simple fallback image
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontSize: 48,
                        fontFamily: 'system-ui',
                    }}
                >
                    Nego
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    }
}
