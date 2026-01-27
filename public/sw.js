// Service Worker for SimplySolutions PWA
// Handles push notifications and offline caching

const CACHE_NAME = 'simplysolutions-v1';
const OFFLINE_URL = '/offline';

// Assets to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/icon.png',
    '/logo-symbol.png',
    '/manifest.webmanifest',
];

// Install event - cache static assets
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (cacheName) {
                        return cacheName !== CACHE_NAME;
                    })
                    .map(function (cacheName) {
                        return caches.delete(cacheName);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', function (event) {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API requests - always go to network
    if (url.pathname.startsWith('/api/')) return;

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) return;

    // For navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(function () {
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // For static assets - cache first, then network
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|ico)$/)
    ) {
        event.respondWith(
            caches.match(request).then(function (cachedResponse) {
                if (cachedResponse) {
                    // Return cached version and update cache in background
                    event.waitUntil(
                        fetch(request).then(function (response) {
                            if (response.ok) {
                                caches.open(CACHE_NAME).then(function (cache) {
                                    cache.put(request, response);
                                });
                            }
                        })
                    );
                    return cachedResponse;
                }
                // Not in cache, fetch and cache
                return fetch(request).then(function (response) {
                    if (response.ok) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }
});

// Push notification handling
self.addEventListener('push', function (event) {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icon.png',
        badge: '/logo-symbol.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag || 'default',
        renotify: true,
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const data = event.notification.data;
    let url = '/';

    // Route based on notification type
    if (data.type === 'order_update' && data.orderId) {
        url = `/dashboard/orders/${data.orderId}`;
    } else if (data.type === 'ticket_reply' && data.ticketId) {
        url = `/dashboard/support/${data.ticketId}`;
    } else if (data.type === 'price_alert' && data.productSlug) {
        url = `/products/${data.productSlug}`;
    } else if (data.type === 'promotion' && data.url) {
        url = data.url;
    } else if (data.type === 'admin_replacement_request') {
        url = '/admin/amazon/requests';
    } else if (data.type === 'admin_low_inventory') {
        url = '/admin/amazon/inventory';
    } else if (data.url) {
        url = data.url;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Try to focus existing window
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(url);
                        return;
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Handle subscription change
self.addEventListener('pushsubscriptionchange', function (event) {
    event.waitUntil(
        self.registration.pushManager.subscribe({ userVisibleOnly: true })
            .then(function (subscription) {
                // Send new subscription to server
                return fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });
            })
    );
});
