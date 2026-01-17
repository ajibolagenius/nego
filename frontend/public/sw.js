// Push Notification Service Worker
// Place this file at /public/sw.js

const CACHE_NAME = 'nego-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);

    let notificationData = {
        title: 'Nego',
        body: 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'nego-notification',
        data: {},
        url: '/dashboard/notifications'
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = {
                ...notificationData,
                ...payload
            };
        } catch (e) {
            // If not JSON, try text
            notificationData.body = event.data.text() || notificationData.body;
        }
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon || '/icon-192.png',
        badge: notificationData.badge || '/badge-72.png',
        tag: notificationData.tag || 'nego-notification',
        data: {
            ...notificationData.data,
            url: notificationData.url || '/dashboard/notifications'
        },
        vibrate: [100, 50, 100],
        actions: notificationData.actions || [
            { action: 'open', title: 'Open', icon: '/icon-192.png' },
            { action: 'close', title: 'Close' }
        ],
        requireInteraction: false,
        silent: false,
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Notification click event
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
                if (client.url.includes(window.location.origin) && 'focus' in client) {
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

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync:', event.tag);
});
