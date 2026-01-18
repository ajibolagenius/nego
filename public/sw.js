// Comprehensive PWA Service Worker for Nego
// Version: 2.1.0 - Fixed Supabase API request handling

const CACHE_VERSION = 'nego-pwa-v2.1.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/login',
    '/register',
    '/offline',
    '/manifest.json',
    '/favicon.ico',
];

// API routes that should be cached
const CACHEABLE_API_ROUTES = [
    '/api/push/vapid-key',
];

// Image domains to cache
const CACHEABLE_IMAGE_DOMAINS = [
    'rmaqeotgpfvdtnvcfpox.supabase.co',
    'res.cloudinary.com',
    'customer-assets.emergentagent.com',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...', CACHE_VERSION);

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[Service Worker] Caching static assets');
            return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
        }).catch((err) => {
            console.error('[Service Worker] Error caching static assets:', err);
        })
    );

    // Force activation of new service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...', CACHE_VERSION);

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches that don't match current version
                    if (cacheName.startsWith('nego-') && !cacheName.includes(CACHE_VERSION)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Clear any cached Supabase API responses that might cause 406 errors
            return Promise.all([
                caches.open(DYNAMIC_CACHE),
                caches.open(API_CACHE),
                caches.open(STATIC_CACHE)
            ]).then((cacheArray) => {
                return Promise.all(
                    cacheArray.map((cache) => {
                        return cache.keys().then((keys) => {
                            return Promise.all(
                                keys.map((request) => {
                                    const url = new URL(request.url);
                                    // Delete any Supabase API requests from cache
                                    if (url.hostname.includes('supabase.co') &&
                                        (url.pathname.startsWith('/rest/v1/') ||
                                         url.pathname.startsWith('/auth/v1/') ||
                                         url.pathname.startsWith('/storage/v1/'))) {
                                        console.log('[Service Worker] Clearing cached Supabase request:', url.pathname);
                                        return cache.delete(request);
                                    }
                                })
                            );
                        });
                    })
                );
            });
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip Supabase REST API calls FIRST - these should always go directly to network
    // Supabase handles caching and we don't want service worker interference
    // This must be checked before any other logic to ensure Supabase requests bypass the service worker
    if (url.hostname.includes('supabase.co') &&
        (url.pathname.startsWith('/rest/v1/') ||
            url.pathname.startsWith('/auth/v1/') ||
            url.pathname.startsWith('/storage/v1/'))) {
        // Let Supabase API requests pass through without service worker interception
        // Also clear any cached bad responses for Supabase requests
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Delete cached response if it exists (might be a bad 406 response)
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.delete(request);
                    });
                }
                // Always fetch fresh from network for Supabase requests
                return fetch(request);
            }).catch(() => {
                // If fetch fails, try network anyway
                return fetch(request);
            })
        );
        return;
    }

    // Skip non-GET requests (after Supabase check)
    if (request.method !== 'GET') {
        return;
    }

    // Skip Vercel-specific endpoints and system endpoints
    if (url.pathname.startsWith('/.well-known/') ||
        url.pathname.startsWith('/_vercel/') ||
        url.pathname.includes('vercel') ||
        url.pathname.includes('jwe')) {
        // Let these requests pass through without service worker interception
        return;
    }

    // Skip Next.js RSC (React Server Component) prefetch requests
    // These are handled by Next.js and shouldn't be cached by service worker
    if (url.searchParams.has('_rsc') ||
        url.searchParams.has('_next') ||
        request.headers.get('RSC') === '1' ||
        request.headers.get('Next-Router-Prefetch') === '1') {
        // Let RSC requests pass through without service worker interception
        return;
    }

    // API routes - Network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }

    // Images - Cache first, fallback to network
    // Exclude Supabase storage API calls (they're handled above)
    if ((request.destination === 'image' ||
        CACHEABLE_IMAGE_DOMAINS.some(domain => url.hostname.includes(domain))) &&
        !url.pathname.startsWith('/storage/v1/')) {
        event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
        return;
    }

    // Static assets (JS, CSS) - Cache first
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        url.pathname.startsWith('/_next/static/')) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }

    // HTML pages - Network first, fallback to cache, then offline page
    if (request.destination === 'document' ||
        request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstWithOfflineFallback(request));
        return;
    }

    // Default: Network first
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Cache First Strategy - for static assets and images
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);

        // Only cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] Cache first error:', error);
        // Return a placeholder for images if offline
        if (request.destination === 'image') {
            return new Response('', { status: 200, statusText: 'OK' });
        }
        throw error;
    }
}

// Network First Strategy - for API calls and dynamic content
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', error);
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return error response for API calls
        if (request.url.includes('/api/')) {
            return new Response(
                JSON.stringify({ error: 'Offline - request cached' }),
                {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        throw error;
    }
}

// Network First with Offline Fallback - for HTML pages
async function networkFirstWithOfflineFallback(request) {
    try {
        const networkResponse = await fetch(request);

        // Cache successful HTML responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', error);
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback to offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/offline');
            if (offlinePage) {
                return offlinePage;
            }
        }

        // Return a basic offline response
        return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection.</p></body></html>',
            {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// Push Notification Handler
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);

    let notificationData = {
        title: 'Nego',
        body: 'You have a new notification',
        icon: '/web-app-manifest-192x192.png',
        badge: '/web-app-manifest-192x192.png',
        tag: 'nego-notification',
        data: {},
        url: '/dashboard/notifications'
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = {
                ...notificationData,
                title: payload.title || notificationData.title,
                body: payload.body || payload.message || notificationData.body,
                icon: payload.icon || notificationData.icon,
                badge: payload.badge || notificationData.badge,
                tag: payload.tag || notificationData.tag,
                data: payload.data || notificationData.data,
                url: payload.url || payload.data?.url || notificationData.url,
                image: payload.image,
                actions: payload.actions
            };
        } catch (e) {
            // If not JSON, try text
            notificationData.body = event.data.text() || notificationData.body;
        }
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon || '/web-app-manifest-192x192.png',
        badge: notificationData.badge || '/web-app-manifest-192x192.png',
        tag: notificationData.tag || 'nego-notification',
        data: {
            ...notificationData.data,
            url: notificationData.url || '/dashboard/notifications'
        },
        vibrate: [100, 50, 100],
        actions: notificationData.actions || [
            { action: 'open', title: 'Open', icon: '/web-app-manifest-192x192.png' },
            { action: 'close', title: 'Close' }
        ],
        requireInteraction: false,
        silent: false,
        renotify: true,
        image: notificationData.image
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event);

    event.notification.close();

    // Handle action buttons
    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/dashboard/notifications';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // Check if there's already a window/tab open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    // Navigate to the notification URL and focus
                    if ('navigate' in client && typeof client.navigate === 'function') {
                        return client.navigate(urlToOpen).then(() => client.focus());
                    } else {
                        return client.focus();
                    }
                }
            }

            // No window open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Background Sync Handler
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    } else if (event.tag === 'sync-bookings') {
        event.waitUntil(syncBookings());
    }
});

// Sync messages when back online
async function syncMessages() {
    // This would sync any pending messages that failed to send
    console.log('[Service Worker] Syncing messages...');
    // Implementation would depend on your message queue system
}

// Sync bookings when back online
async function syncBookings() {
    // This would sync any pending booking actions
    console.log('[Service Worker] Syncing bookings...');
    // Implementation would depend on your booking queue system
}

// Message handler for communication with the app
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});
