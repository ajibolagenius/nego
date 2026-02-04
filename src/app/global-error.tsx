/**
 * Global error page for critical errors that occur during server-side rendering.
 * This is a fallback when the app fails to render entirely.
 */
export default function GlobalError({
    error: _error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en">
            <body style={{
                backgroundColor: '#000',
                color: '#fff',
                fontFamily: 'system-ui, sans-serif',
                margin: 0,
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    {/* Warning Icon SVG */}
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 256 256"
                        fill="none"
                        style={{ margin: '0 auto 24px' }}
                    >
                        <path
                            d="M236.8 188.09l-88-152.16a24 24 0 00-41.6 0l-88 152.16A24 24 0 0040 216h176a24 24 0 0020.8-27.91z"
                            fill="rgba(234, 179, 8, 0.2)"
                            stroke="#EAB308"
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <line x1="128" y1="104" x2="128" y2="144" stroke="#EAB308" strokeWidth="16" strokeLinecap="round" />
                        <circle cx="128" cy="180" r="12" fill="#EAB308" />
                    </svg>

                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        marginBottom: '12px'
                    }}>
                        Critical Error
                    </h1>

                    <p style={{
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: '24px',
                        lineHeight: 1.5
                    }}>
                        The application encountered a critical error and cannot continue.
                        Please try refreshing the page.
                    </p>

                    <button
                        onClick={() => reset()}
                        style={{
                            backgroundColor: '#df2531',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '9999px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginRight: '12px'
                        }}
                    >
                        Try Again
                    </button>

                    <a
                        href="/"
                        style={{
                            display: 'inline-block',
                            backgroundColor: 'transparent',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '12px 24px',
                            borderRadius: '9999px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            fontSize: '14px'
                        }}
                    >
                        Go Home
                    </a>
                </div>
            </body>
        </html>
    )
}
