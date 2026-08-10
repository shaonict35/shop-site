// Firebase Cloud Messaging Service Worker (firebase-messaging-sw.js)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Handle background push messages
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const notification = payload.notification || payload.data || {};
    const title = notification.title || payload.title || 'GlowGoodly Offer';
    const body = notification.body || notification.message || payload.body || '';
    const image = notification.image || notification.imageUrl || payload.image || null;
    const icon = notification.icon || '/bkash-logo.png';
    const targetUrl = notification.data?.url || payload.data?.url || payload.url || '/';

    const notificationOptions = {
      body: body,
      icon: icon,
      badge: '/bkash-logo.png',
      image: image || undefined, // Rich Push Promotional Banner
      data: {
        url: targetUrl,
      },
      actions: [
        { action: 'open_url', title: 'View Offer 🛍️' }
      ],
      vibrate: [200, 100, 200],
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  } catch (err) {
    console.error('Error handling background push:', err);
  }
});

// Handle notification click event
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
