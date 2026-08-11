import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        loader: 'custom',
        loaderFile: './src/lib/image-loader.ts',
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'customer-assets.emergentagent.com',
            },
            {
                protocol: 'https',
                hostname: 'rmaqeotgpfvdtnvcfpox.supabase.co',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
            },
        ],
    },

    // Security headers
    async headers() {
        return [
            {
                // The service worker script must never be served from a cache.
                // A cached /sw.js is the classic reason a PWA fix does not reach
                // users: the browser compares the bytes it fetches against the
                // installed worker, so if an intermediary hands back the old
                // file, no update is ever detected and the stale worker keeps
                // running indefinitely. `updateViaCache: 'none'` covers the HTTP
                // cache on the registration side; this covers the CDN.
                source: '/sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/',
                    },
                ],
            },
            {
                // Same reasoning: a stale manifest keeps the old icons, name and
                // shortcuts on installed PWAs.
                source: '/manifest.json',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, must-revalidate',
                    },
                ],
            },
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(self), microphone=(), geolocation=(self)',
                    },
                ],
            },
        ];
    },

    // Optimize package imports for faster builds and smaller bundles
    experimental: {
        optimizePackageImports: [
            '@phosphor-icons/react',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react',
        ],
    },
};

export default nextConfig;
