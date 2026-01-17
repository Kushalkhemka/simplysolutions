// Service Worker for Push Notifications
// This file should be in the public folder

self.addEventListener('push', function (event) {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/logo-symbol.png',
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
