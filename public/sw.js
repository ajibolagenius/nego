// Comprehensive PWA Service Worker for Nego
// Version: 3.0.0 - Push subscription self-healing (pushsubscriptionchange +
//                  SYNC_PUSH_SUBSCRIPTION), forced activation on update.

const SW_VERSION = '3.0.0';
const CACHE_VERSION = 'nego-pwa-v3.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/login',
    '/register',
    '/offline',
    '/manifest.json',
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
                    if (cacheName.startsWith('nego-') && !cacheName.includes(CACHE_VERSION)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        }).then(async () => {
            // A new worker taking over is the one moment we know a client is
            // live and the browser's push state is authoritative. Reconcile the
            // stored subscription now so an install that lost its server-side
            // row is repaired without waiting for the user to visit Settings.
            await syncPushSubscription('activate');

            const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of clientList) {
                client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
            }
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

    // Let the browser handle all cross-origin requests directly.
    // This avoids opaque-response caching issues and noisy remote image failures.
    if (url.origin !== self.location.origin) {
        return;
    }

    // Skip non-GET requests
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
    if (request.destination === 'image') {
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

// ---------------------------------------------------------------------------
// Push subscription lifecycle
//
// Browsers rotate a push subscription on their own schedule (Chrome does it
// when it re-keys FCM, Safari on some upgrades, and any browser after a long
// idle period). When that happens the endpoint stored server-side stops
// working: web-push gets 410 Gone and `sendPushToUsers` deletes the row.
//
// Until now nothing ever wrote a new row, because the only code path that saved
// a subscription was the user manually pressing "Enable" in Settings. So the
// first rotation silently and permanently ended push for that install — the
// browser still reported an active subscription, so the UI kept claiming
// notifications were on. That is the bug behind "the notification is not
// working, I miss clients all the time".
// ---------------------------------------------------------------------------

function base64UrlToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const output = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        output[i] = rawData.charCodeAt(i);
    }
    return output;
}

// Never read the VAPID key from a cached response: a stale key produces a
// subscription the server cannot sign for, which fails silently at send time.
async function fetchVapidPublicKey() {
    const response = await fetch('/api/push/vapid-key', {
        credentials: 'same-origin',
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`vapid-key request failed: ${response.status}`);
    }
    const { publicKey } = await response.json();
    if (!publicKey) {
        throw new Error('vapid-key response had no publicKey');
    }
    return publicKey;
}

async function saveSubscriptionToServer(subscription, oldEndpoint) {
    const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The SW has no session of its own; cookies are what authenticate this.
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
            subscription: subscription.toJSON ? subscription.toJSON() : subscription,
            oldEndpoint: oldEndpoint || undefined,
            source: 'service-worker',
        }),
    });

    if (!response.ok) {
        throw new Error(`subscribe request failed: ${response.status}`);
    }
    return response;
}

/**
 * Make the server's stored subscription match this browser's actual one.
 *
 * Deliberately does NOT call Notification.requestPermission() or otherwise
 * prompt: it only repairs installs that already granted permission. If
 * permission was never granted, or was revoked, it is a no-op.
 */
async function syncPushSubscription(reason, oldSubscription) {
    try {
        if (!self.registration || !self.registration.pushManager) {
            return { ok: false, reason: 'push-unsupported' };
        }

        // Re-prompting is impossible from a SW, so bail unless already granted.
        if (self.Notification && self.registration.pushManager.permissionState) {
            try {
                const state = await self.registration.pushManager.permissionState({ userVisibleOnly: true });
                if (state !== 'granted') {
                    return { ok: false, reason: `permission-${state}` };
                }
            } catch {
                // permissionState is not implemented everywhere; fall through.
            }
        }

        let subscription = await self.registration.pushManager.getSubscription();

        // A rotation fires pushsubscriptionchange with the old subscription
        // already gone, so re-subscribe with the current server key.
        if (!subscription) {
            const publicKey = await fetchVapidPublicKey();
            subscription = await self.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64UrlToUint8Array(publicKey),
            });
        }

        const oldEndpoint = oldSubscription?.endpoint;
        await saveSubscriptionToServer(subscription, oldEndpoint);
        console.log(`[Service Worker] Push subscription synced (${reason})`);
        return { ok: true, endpoint: subscription.endpoint };
    } catch (error) {
        // Sync failures must stay silent to the user; the next app load and the
        // next activation both retry.
        console.warn(`[Service Worker] Push subscription sync failed (${reason}):`, error);
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }
}

self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[Service Worker] Push subscription changed — resubscribing');
    event.waitUntil(syncPushSubscription('pushsubscriptionchange', event.oldSubscription));
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

    // The page asks for this on every load once the user is authenticated, so a
    // subscription that rotated while the app was closed is repaired on the next
    // visit even if pushsubscriptionchange was never delivered (Chrome has
    // historically not fired it reliably).
    if (event.data && event.data.type === 'SYNC_PUSH_SUBSCRIPTION') {
        event.waitUntil(
            syncPushSubscription('app-request').then((result) => {
                if (event.source) {
                    event.source.postMessage({ type: 'PUSH_SYNC_RESULT', ...result });
                }
            })
        );
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        if (event.source) {
            event.source.postMessage({ type: 'SW_VERSION', version: SW_VERSION });
        }
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});
