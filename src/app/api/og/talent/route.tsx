import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const username = searchParams.get('username')
        const talentId = searchParams.get('id')

        if (!username && !talentId) {
            return new Response('Missing username or id parameter', { status: 400 })
        }

        // Fetch talent data using API client (service role, works in edge runtime)
        const supabase = createApiClient()
        let talent

        if (username) {
            const { data } = await supabase
                .from('profiles')
                .select('display_name, username, avatar_url, bio')
                .eq('role', 'talent')
                .eq('username', username)
                .single()
            talent = data
        } else if (talentId) {
            const { data } = await supabase
                .from('profiles')
                .select('display_name, username, avatar_url, bio')
                .eq('role', 'talent')
                .eq('id', talentId)
                .single()
            talent = data
        }

        if (!talent) {
            return new Response('Talent not found', { status: 404 })
        }

        const talentName = talent.display_name || 'Talent Profile'
        const avatarUrl = talent.avatar_url
        const bio = talent.bio || 'Premium Managed Talent Marketplace'

        // Brand colors
        const bgColor = '#000000'
        const primaryColor = '#df2531'
        const textColor = '#ffffff'
        const textSecondary = '#a0a0a0'

        // Fetch avatar image if available and convert to data URI
        // Note: For OG images, we need to embed the image as base64 data URI
        let avatarDataUri: string | null = null
        if (avatarUrl) {
            try {
                // Fetch the avatar image
                const avatarResponse = await fetch(avatarUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                    },
                })

                if (avatarResponse.ok) {
                    const arrayBuffer = await avatarResponse.arrayBuffer()

                    // Limit image size to prevent issues (max 500KB for OG images)
                    if (arrayBuffer.byteLength > 500 * 1024) {
                        console.warn(`Avatar image too large (${arrayBuffer.byteLength} bytes), skipping embed`)
                    } else {
                        const uint8Array = new Uint8Array(arrayBuffer)

                        // Convert ArrayBuffer to base64 (edge runtime compatible)
                        // Build binary string character by character (works reliably in edge runtime)
                        let binaryString = ''
                        for (let i = 0; i < uint8Array.length; i++) {
                            binaryString += String.fromCharCode(uint8Array[i])
                        }

                        const base64 = btoa(binaryString)
                        const mimeType = avatarResponse.headers.get('content-type') || 'image/png'
                        avatarDataUri = `data:${mimeType};base64,${base64}`
                    }
                }
            } catch (error) {
                console.error('Error fetching avatar for OG image:', error)
                // Continue without avatar - will show fallback star icon
            }
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bgColor,
                        backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a0a0a 50%, #000000 100%)',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        position: 'relative',
                        padding: '80px',
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
                            background: `radial-gradient(circle at 70% 50%, ${primaryColor}20 0%, transparent 60%)`,
                        }}
                    />

                    {/* Left side - Avatar */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginRight: 60,
                        }}
                    >
                        {avatarDataUri ? (
                            <div
                                style={{
                                    width: 280,
                                    height: 280,
                                    borderRadius: 140,
                                    border: `4px solid ${primaryColor}`,
                                    backgroundImage: `url(${avatarDataUri})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 280,
                                    height: 280,
                                    borderRadius: 140,
                                    border: `4px solid ${primaryColor}`,
                                    backgroundColor: '#1a1a1a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 120,
                                    color: primaryColor,
                                }}
                            >
                                ⭐
                            </div>
                        )}
                    </div>

                    {/* Right side - Content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            maxWidth: 700,
                        }}
                    >
                        {/* Brand */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: 30,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 36,
                                    fontWeight: 700,
                                    color: textColor,
                                    letterSpacing: '-1px',
                                }}
                            >
                                NEGO
                            </div>
                            <div
                                style={{
                                    fontSize: 36,
                                    fontWeight: 700,
                                    color: primaryColor,
                                    marginLeft: 4,
                                }}
                            >
                                .
                            </div>
                        </div>

                        {/* Talent Name */}
                        <div
                            style={{
                                fontSize: 64,
                                fontWeight: 800,
                                color: textColor,
                                marginBottom: 20,
                                lineHeight: 1.1,
                            }}
                        >
                            {talentName}
                        </div>

                        {/* Bio/Description */}
                        <div
                            style={{
                                fontSize: 28,
                                color: textSecondary,
                                lineHeight: 1.5,
                                maxHeight: 120,
                                overflow: 'hidden',
                            }}
                        >
                            {bio.length > 100 ? `${bio.substring(0, 100)}...` : bio}
                        </div>

                        {/* Badge */}
                        <div
                            style={{
                                marginTop: 30,
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 24px',
                                backgroundColor: `${primaryColor}20`,
                                border: `2px solid ${primaryColor}`,
                                borderRadius: 8,
                                width: 'fit-content',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 20,
                                    color: primaryColor,
                                    fontWeight: 600,
                                }}
                            >
                                Verified Talent
                            </div>
                        </div>
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
        console.error('Talent OG image generation error:', error)
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
                    Nego - Talent Profile
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    }
}
